import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/DashboardContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home() {
  const supabase = createClient();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentYear = new Date().getFullYear();

  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

  // Calculate the last day of the current month
  const lastDayOfCurrentMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

  // Fetch data in parallel
  const [categoriesResult, transactionsResult, budgetsResult] = await Promise.all([
    supabase.from("categories").select("id, name").order("order_index", { ascending: true }).order("name", { ascending: true }),
    supabase
      .from("transactions")
      .select("id, amount, category_id, description, date")
      .gte("date", `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
      .lt("date", `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`)
      .order("date", { ascending: false })
      .limit(5), // Recent activities
    supabase
      .from("budgets")
      .select("amount, category_id")
      .eq("year_month", lastDayOfCurrentMonth),
  ]);

  if (categoriesResult.error || transactionsResult.error || budgetsResult.error) {
    console.error("Dashboard data fetch error:", categoriesResult.error || transactionsResult.error || budgetsResult.error);
    return <div className="p-4 text-red-500">Error loading dashboard data.</div>;
  }

  const categories = categoriesResult.data || [];
  const transactions = transactionsResult.data || [];
  const budgets = budgetsResult.data || [];

  // Calculate actual spending per category
  const actuals: { [categoryId: string]: number } = {};
  transactions.forEach((t) => {
    if (t.category_id) {
      actuals[t.category_id] = (actuals[t.category_id] || 0) + t.amount;
    }
  });

  // Calculate budget per category
  const monthlyBudgets: { [categoryId: string]: number } = {};
  budgets.forEach((b) => {
    if (b.category_id) {
      monthlyBudgets[b.category_id] = b.amount;
    }
  });

  // Prepare data for DashboardContent
  const categorySummary = categories.map((cat) => {
    const budgeted = monthlyBudgets[cat.id] || 0;
    const spent = actuals[cat.id] || 0;
    return {
      id: cat.id,
      name: cat.name,
      budgeted,
      spent,
      remaining: budgeted - spent,
      percentage: budgeted > 0 ? Math.round((spent / budgeted) * 100) : 0,
    };
  });

  return (
    <main className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-4">m-manager</h1>
      <nav className="flex flex-wrap gap-4 mb-8">
        <Button asChild>
          <Link href="/new-transaction">新規取引入力</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/budgets">予算設定</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/categories">カテゴリ管理</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/fixed-costs">固定費管理</Link>
        </Button>
      </nav>

      <DashboardContent
        currentMonth={currentMonth}
        currentYear={currentYear}
        categorySummary={categorySummary}
        recentTransactions={transactions}
      />
    </main>
  );
}
