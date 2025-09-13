-- 1. カテゴリテーブルの作成
CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. 取引テーブルの作成
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  amount INT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID DEFAULT auth.uid() NOT NULL
);

-- 3. 予算テーブルの作成
CREATE TABLE public.budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year_month DATE NOT NULL,
  amount INT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID DEFAULT auth.uid() NOT NULL,
  UNIQUE(user_id, year_month, category_id)
);

-- 4. 全テーブルでRLS (Row Level Security) を有効化
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- 5. RLSポリシーの作成
-- カテゴリは全ての認証ユーザーが読み書き可能
CREATE POLICY "Allow all users to manage categories"
ON public.categories
FOR ALL
TO authenticated
USING (true);

-- 取引は自分のデータのみ操作可能
CREATE POLICY "Allow users to manage their own transactions"
ON public.transactions
FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- 予算は自分のデータのみ操作可能
CREATE POLICY "Allow users to manage their own budgets"
ON public.budgets
FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- 6. 初期カテゴリの追加
INSERT INTO public.categories (name) VALUES
('食費'), ('交通費'), ('趣味'), ('交際費'), ('家賃'), ('水道光熱費'), ('通信費'), ('その他');

-- 7. 固定費テーブルの作成
CREATE TABLE public.fixed_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount INT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  recurrence TEXT NOT NULL, -- 'monthly' or 'yearly'
  execution_day INT NOT NULL, -- Day of the month (1-31) or day of the year (1-366)
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID DEFAULT auth.uid() NOT NULL
);

-- 8. 固定費テーブルでRLS (Row Level Security) を有効化
ALTER TABLE public.fixed_costs ENABLE ROW LEVEL SECURITY;

-- 9. RLSポリシーの作成 (固定費は自分のデータのみ操作可能)
CREATE POLICY "Allow users to manage their own fixed costs"
ON public.fixed_costs
FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- 10. 固定費を自動計上するSQL関数の作成
CREATE OR REPLACE FUNCTION public.process_fixed_costs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- ユーザーの権限ではなく、関数の所有者の権限で実行
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
            AND description = fixed_cost_record.description -- descriptionも一致するか確認
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
    -- もしyearlyが特定の月日を指す場合は、ロジックを調整する必要がある
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
            AND execution_day <= EXTRACT(DAY FROM current_date) -- 今日の日付までに実行日が来ているもの
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
            AND EXTRACT(YEAR FROM date) = current_year; -- 年単位でチェック

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
