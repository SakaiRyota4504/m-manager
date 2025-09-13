import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BudgetMatrix } from "@/components/BudgetMatrix";

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: { year?: string };
}) {
  const year = searchParams.year ? parseInt(searchParams.year) : new Date().getFullYear();
  const supabase = createClient();

  const [categoriesResult, budgetsResult] = await Promise.all([
    supabase.from("categories").select("id, name").order("order_index", { ascending: true }).order("name", { ascending: true }),
    supabase
      .from("budgets")
      .select("category_id, year_month, amount")
      .gte("year_month", `${year}-01-01`)
      .lte("year_month", `${year}-12-31`),
  ]);

  if (categoriesResult.error) {
    return <div className="p-4 text-red-500">Error loading categories: {categoriesResult.error.message}</div>;
  }
  if (budgetsResult.error) {
    return <div className="p-4 text-red-500">Error loading budgets: {budgetsResult.error.message}</div>;
  }

  const budgetMatrix: { [categoryId: string]: { [month: number]: number } } = {};
  for (const budget of budgetsResult.data) {
    const month = new Date(budget.year_month).getUTCMonth() + 1;
    if (!budgetMatrix[budget.category_id]) {
      budgetMatrix[budget.category_id] = {};
    }
    budgetMatrix[budget.category_id][month] = budget.amount;
  }

  return (
    <div className="p-4 md:p-8">
      <Card className="w-full max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle>予算設定</CardTitle>
          <CardDescription>
            年間の月別・カテゴリ別予算を設定します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BudgetMatrix
            year={year}
            categories={categoriesResult.data || []}
            initialBudgets={budgetMatrix}
          />
        </CardContent>
      </Card>
    </div>
  );
}
