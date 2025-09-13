import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FixedCostManager } from "@/components/FixedCostManager";
import { getFixedCosts } from "@/lib/actions/fixed-costs"; // サーバーアクションをインポート
import { getCategories } from "@/lib/actions/categories"; // サーバーアクションをインポート

export default async function FixedCostsPage() {
  const [fixedCostsResult, categoriesResult] = await Promise.all([
    getFixedCosts(), // サーバーアクションから固定費を取得
    getCategories(), // サーバーアクションからカテゴリを取得
  ]);

  if (fixedCostsResult.error) {
    return <div className="p-4 text-red-500">Error loading fixed costs: {fixedCostsResult.error}</div>;
  }
  if (categoriesResult.error) {
    return <div className="p-4 text-red-500">Error loading categories: {categoriesResult.error}</div>;
  }

  const fixedCosts = fixedCostsResult.fixedCosts || [];
  const categories = categoriesResult.categories || [];

  return (
    <div className="p-4 md:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>固定費管理</CardTitle>
          <CardDescription>
            毎月自動で登録される固定費を設定します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FixedCostManager fixedCosts={fixedCosts} categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}