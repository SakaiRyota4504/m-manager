import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TransactionForm } from "@/components/TransactionForm";

export default async function EditTransactionPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { id } = params;

  // Fetch transaction and categories in parallel
  const [transactionResult, categoriesResult] = await Promise.all([
    supabase.from("transactions").select("*").eq("id", id).single(),
    supabase.from("categories").select("id, name").order("name", { ascending: true }),
  ]);

  if (transactionResult.error) {
    return <div className="p-4 text-red-500">Error loading transaction: {transactionResult.error.message}</div>;
  }
  if (categoriesResult.error) {
    return <div className="p-4 text-red-500">Error loading categories: {categoriesResult.error.message}</div>;
  }

  const transaction = transactionResult.data;
  const categories = categoriesResult.data || [];

  return (
    <div className="p-4 md:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>取引の編集</CardTitle>
          <CardDescription>
            取引内容を編集します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionForm
            categories={categories}
            initialTransaction={transaction} // Pass initial transaction data
          />
        </CardContent>
      </Card>
    </div>
  );
}
