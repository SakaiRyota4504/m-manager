'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button' // Import Button
import Link from 'next/link' // Import Link
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

type CategorySummary = {
  id: string
  name: string
  budgeted: number
  spent: number
  remaining: number
  percentage: number
}

type RecentTransaction = {
  id: string
  amount: number
  category_id: string | null
  description: string | null
  date: string
}

type TodaySchedule = {
  id: string;
  title: string;
  date: string;
}

interface DashboardContentProps {
  currentMonth: number
  currentYear: number
  categorySummary: CategorySummary[]
  recentTransactions: RecentTransaction[]
  todaySchedules: TodaySchedule[];
}

export function DashboardContent({
  currentMonth,
  currentYear,
  categorySummary,
  recentTransactions,
  todaySchedules,
}: DashboardContentProps) {
  const totalBudgeted = categorySummary.reduce((sum, cat) => sum + cat.budgeted, 0)
  const totalSpent = categorySummary.reduce((sum, cat) => sum + cat.spent, 0)
  const totalRemaining = totalBudgeted - totalSpent
  const totalPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-8">
        {/* Overall Summary */}
        <Card>
          <CardHeader>
            <CardTitle>{currentYear}年{currentMonth}月の概要</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-lg font-medium">
              <span>予算合計:</span>
              <span>{totalBudgeted.toLocaleString()}円</span>
            </div>
            <div className="flex justify-between text-lg font-medium">
              <span>支出合計:</span>
              <span>{totalSpent.toLocaleString()}円</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>残り:</span>
              <span className={totalRemaining < 0 ? 'text-destructive' : 'text-primary'}>
                {totalRemaining.toLocaleString()}円
              </span>
            </div>
            <Progress value={totalPercentage} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              予算の {totalPercentage}% を使用しました。
            </p>
          </CardContent>
        </Card>

        {/* Category-wise Summary */}
        <Card>
          <CardHeader>
            <CardTitle>カテゴリ別予実比</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categorySummary.length === 0 ? (
              <p className="text-muted-foreground">今月の予算または取引がありません。</p>
            ) : (
              categorySummary.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{cat.name}</span>
                    <span>{cat.spent.toLocaleString()}円 / {cat.budgeted.toLocaleString()}円</span>
                  </div>
                  <Progress value={cat.percentage} className="w-full" />
                  <p className="text-xs text-muted-foreground">
                    残り: {cat.remaining.toLocaleString()}円
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      <div className="space-y-8">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>今日のスケジュール</CardTitle>
          </CardHeader>
          <CardContent>
            {todaySchedules.length === 0 ? (
              <p className="text-muted-foreground">今日の予定はありません。</p>
            ) : (
              <ul className="space-y-2">
                {todaySchedules.map((schedule) => (
                  <li key={schedule.id} className="flex items-center">
                    <span className="font-medium">{schedule.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>最近の動き</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-muted-foreground">今月の取引履歴がありません。</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日付</TableHead>
                    <TableHead>カテゴリ</TableHead>
                    <TableHead>内容</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                    <TableHead className="text-right">操作</TableHead> {/* New TableHead */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((t, index) => (
                    <TableRow key={index}>
                      <TableCell>{format(new Date(t.date), 'MM/dd', { locale: ja })}</TableCell>
                      <TableCell>{categorySummary.find(c => c.id === t.category_id)?.name || '未分類'}</TableCell>
                      <TableCell>{t.description || '-'}</TableCell>
                      <TableCell className="text-right">{t.amount.toLocaleString()}円</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/transactions/${t.id}/edit`}>編集</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
