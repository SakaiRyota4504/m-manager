import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CategoryManager } from "@/components/CategoryManager";

// This page will be dynamically rendered because it uses the Supabase server client.

export default async function CategoriesPage() {
  const supabase = createClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .order("order_index", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    // A real app would handle this more gracefully
    return <div className="p-4 text-red-500">Error loading categories: {error.message}</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>カテゴリ管理</CardTitle>
          <CardDescription>
            取引に使用するカテゴリを追加・削除します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryManager initialCategories={categories || []} />
        </CardContent>
      </Card>
    </div>
  );
}
