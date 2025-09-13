import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TransactionForm } from "@/components/TransactionForm";

export default async function NewTransactionPage() {
  const supabase = createClient();

  // Fetch categories to pass to the form
  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("order_index", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return <div className="p-4 text-red-500">Error loading categories: {error.message}</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>新規取引入力</CardTitle>
          <CardDescription>
            新しい支出または収入を記録します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionForm categories={categories || []} />
        </CardContent>
      </Card>
    </div>
  );
}
