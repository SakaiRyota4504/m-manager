-- 固定費を自動計上するSQL関数の作成
CREATE OR REPLACE FUNCTION public.process_fixed_costs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    fixed_cost_record RECORD;
    current_date DATE := CURRENT_DATE;
    current_year INT := EXTRACT(YEAR FROM current_date);
    current_month INT := EXTRACT(MONTH FROM current_date);
    transaction_date DATE;
    existing_transaction_count INT;
BEGIN
    -- 毎月の固定費を処理
    FOR fixed_cost_record IN
        SELECT
            id,
            description,
            amount,
            category_id,
            user_id,
            recurrence,
            execution_day
        FROM
            public.fixed_costs
        WHERE
            recurrence = 'monthly'
            AND execution_day <= EXTRACT(DAY FROM current_date) -- 今日の日付までに実行日が来ているもの
    LOOP
        -- 取引日を計算 (現在の年月の実行日)
        transaction_date := MAKE_DATE(current_year, current_month, fixed_cost_record.execution_day);

        -- 既に同じ固定費が今月計上されていないか確認
        SELECT COUNT(*)
        INTO existing_transaction_count
        FROM public.transactions
        WHERE
            user_id = fixed_cost_record.user_id
            AND category_id = fixed_cost_record.category_id
            AND amount = fixed_cost_record.amount
            AND description = fixed_cost_record.description
            AND date = transaction_date;

        IF existing_transaction_count = 0 THEN
            -- 重複がなければ挿入
            INSERT INTO public.transactions (
                date,
                amount,
                description,
                category_id,
                user_id
            ) VALUES (
                transaction_date,
                fixed_cost_record.amount,
                fixed_cost_record.description,
                fixed_cost_record.category_id,
                fixed_cost_record.user_id
            );
        END IF;
    END LOOP;

    -- 年間の固定費を処理 (現在の実装ではexecution_dayが1-31なので、monthlyと同様に処理)
    FOR fixed_cost_record IN
        SELECT
            id,
            description,
            amount,
            category_id,
            user_id,
            recurrence,
            execution_day
        FROM
            public.fixed_costs
        WHERE
            recurrence = 'yearly'
            AND execution_day <= EXTRACT(DAY FROM current_date)
    LOOP
        -- 取引日を計算 (現在の年月の実行日)
        transaction_date := MAKE_DATE(current_year, current_month, fixed_cost_record.execution_day);

        -- 既に同じ固定費が今年計上されていないか確認 (yearlyの場合は年単位で重複チェック)
        SELECT COUNT(*)
        INTO existing_transaction_count
        FROM public.transactions
        WHERE
            user_id = fixed_cost_record.user_id
            AND category_id = fixed_cost_record.category_id
            AND amount = fixed_cost_record.amount
            AND description = fixed_cost_record.description
            AND EXTRACT(YEAR FROM date) = current_year;

        IF existing_transaction_count = 0 THEN
            -- 重複がなければ挿入
            INSERT INTO public.transactions (
                date,
                amount,
                description,
                category_id,
                user_id
            ) VALUES (
                transaction_date,
                fixed_cost_record.amount,
                fixed_cost_record.description,
                fixed_cost_record.category_id,
                fixed_cost_record.user_id
            );
        END IF;
    END LOOP;

END;
$$;

-- pg_cron ジョブのスケジュール設定
-- 毎月1日の午前0時に process_fixed_costs() 関数を実行
SELECT cron.schedule(
    'process_fixed_costs_monthly', -- ジョブ名 (任意)
    '0 0 1 * *',                   -- 毎月1日の午前0時に実行 (cron式)
    'SELECT public.process_fixed_costs();' -- 実行するSQLコマンド
);
