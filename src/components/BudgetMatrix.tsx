'use client'

import { useState, useTransition, ChangeEvent, useMemo, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { updateBudget, bulkUpdateBudgets } from '@/lib/actions/budgets' // Import bulkUpdateBudgets
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Category = {
  id: string
  name: string
}

type BudgetMatrixData = {
  [categoryId: string]: { [month: number]: number }
}

interface BudgetMatrixProps {
  year: number
  categories: Category[]
  initialBudgets: BudgetMatrixData
}

export function BudgetMatrix({ year, categories, initialBudgets }: BudgetMatrixProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [budgets, setBudgets] = useState(initialBudgets)

  // New state to manage input values as strings for formatting
  const [inputValues, setInputValues] = useState<{ [categoryId: string]: { [month: number]: string } }>(() => {
    const initial: { [categoryId: string]: { [month: number]: string } } = {};
    categories.forEach(cat => {
      initial[cat.id] = {};
      const months = Array.from({ length: 12 }, (_, i) => i + 1);
      months.forEach(month => {
        initial[cat.id][month] = (initialBudgets[cat.id]?.[month] || '').toLocaleString();
      });
    });
    return initial;
  });

  // New state for bulk input values
  const [bulkInputValues, setBulkInputValues] = useState<{ [categoryId: string]: string }>({});
  const [bulkAmounts, setBulkAmounts] = useState<{ [categoryId: string]: number }>({});


  const handleYearChange = (newYear: number) => {
    router.push(`${pathname}?year=${newYear}`)
  }

  // Update inputValues when initialBudgets changes (e.g., year change)
  useEffect(() => {
    const newInitial: { [categoryId: string]: { [month: number]: string } } = {};
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    categories.forEach(cat => {
      newInitial[cat.id] = {};
      months.forEach(month => {
        newInitial[cat.id][month] = (initialBudgets[cat.id]?.[month] || '').toLocaleString();
      });
    });
    setInputValues(newInitial);
    setBudgets(initialBudgets); // Keep this for the actual number values
  }, [initialBudgets, categories]);


  const handleInputChange = (
    categoryId: string,
    month: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const rawValue = event.target.value;
    const numericValue = parseInt(rawValue.replace(/,/g, ''), 10) || 0;

    // Update local string state for input display
    setInputValues(prev => ({
      ...prev,
      [categoryId]: {
        ...(prev[categoryId] || {}),
        [month]: rawValue,
      },
    }));

    // Update the actual numeric budget state
    setBudgets(prev => ({
      ...prev,
      [categoryId]: {
        ...(prev[categoryId] || {}),
        [month]: numericValue,
      },
    }));
  };

  const handleInputBlur = (
    categoryId: string,
    month: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const rawValue = event.target.value;
    const numericValue = parseInt(rawValue.replace(/,/g, ''), 10) || 0;

    // Format the displayed value on blur
    setInputValues(prev => ({
      ...prev,
      [categoryId]: {
        ...(prev[categoryId] || {}),
        [month]: numericValue.toLocaleString(),
      },
    }));

    // Call server action only if value changed from initial or is valid
    startTransition(async () => {
      const result = await updateBudget({
        year,
        month,
        categoryId,
        amount: numericValue,
      })
      if (result?.error) {
        toast.error(result.error)
        // Revert optimistic update on error if needed
        setInputValues(prev => ({
          ...prev,
          [categoryId]: {
            ...(prev[categoryId] || {}),
            [month]: (initialBudgets[categoryId]?.[month] || '').toLocaleString(), // Revert to original
          },
        }));
        setBudgets(initialBudgets); // Revert actual number state
      } else {
        // Do not show toast on every change to avoid being noisy
      }
    })
  };

  const handleBulkApply = (categoryId: string) => {
    const amount = bulkAmounts[categoryId];
    if (amount === undefined || isNaN(amount)) {
      toast.error("有効な金額を入力してください。");
      return;
    }

    startTransition(async () => {
      const result = await bulkUpdateBudgets({ // Use bulkUpdateBudgets
        year,
        categoryId,
        amount,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`${categories.find(c => c.id === categoryId)?.name} の予算を一括設定しました。`);
        // Clear the bulk input field after successful application
        setBulkInputValues(prev => ({ ...prev, [categoryId]: '' }));
        setBulkAmounts(prev => ({ ...prev, [categoryId]: 0 }));
      }
    });
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  // Calculate totals
  const { rowTotals, columnTotals, grandTotal } = useMemo(() => {
    const newRowTotals: { [categoryId: string]: number } = {}
    const newColumnTotals: { [month: number]: number } = {}
    let newGrandTotal = 0

    categories.forEach(category => {
      newRowTotals[category.id] = 0
      months.forEach(month => {
        const amount = budgets[category.id]?.[month] || 0
        newRowTotals[category.id] += amount
        newColumnTotals[month] = (newColumnTotals[month] || 0) + amount
        newGrandTotal += amount
      })
    })
    return { rowTotals: newRowTotals, columnTotals: newColumnTotals, grandTotal: newGrandTotal }
  }, [budgets, categories, months])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={() => handleYearChange(year - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xl font-bold">{year}年</span>
        <Button variant="outline" size="icon" onClick={() => handleYearChange(year + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px] sticky left-0 bg-background z-10">カテゴリ</TableHead>
              {months.map(month => (
                <TableHead key={month} className="text-center min-w-[120px]">{month}月</TableHead>
              ))}
              <TableHead className="text-center min-w-[120px] sticky right-0 bg-background z-10">合計</TableHead>
              <TableHead className="text-center min-w-[150px] sticky right-0 bg-background z-10">一括設定</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map(category => (
              <TableRow key={category.id}>
                <TableCell className="font-medium sticky left-0 bg-background z-10">{category.name}</TableCell>
                {months.map(month => (
                  <TableCell key={month}>
                    <Input
                      type="text"
                      placeholder="0"
                      value={inputValues[category.id]?.[month] || ''}
                      onChange={(e) => handleInputChange(category.id, month, e)}
                      onBlur={(e) => handleInputBlur(category.id, month, e)}
                      className="min-w-[100px] text-right"
                      disabled={isPending}
                    />
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold sticky right-0 bg-background z-10">
                  {rowTotals[category.id].toLocaleString()}
                </TableCell>
                <TableCell className="text-right sticky right-0 bg-background z-10">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="text"
                      placeholder="0"
                      className="min-w-[80px] text-right"
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        const numericValue = parseInt(rawValue.replace(/,/g, ''), 10) || 0;
                        setBulkInputValues(prev => ({ ...prev, [category.id]: rawValue }));
                        setBulkAmounts(prev => ({ ...prev, [category.id]: numericValue }));
                      }}
                      value={bulkInputValues[category.id] || ''}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleBulkApply(category.id)}
                      disabled={isPending || !bulkAmounts[category.id]}
                    >
                      適用
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {/* Totals Row */}
            <TableRow className="bg-muted/50 font-bold">
              <TableCell className="sticky left-0 bg-muted/50 z-10">月合計</TableCell>
              {months.map(month => (
                <TableCell key={month} className="text-right">
                  {columnTotals[month]?.toLocaleString() || 0}
                </TableCell>
              ))}
              <TableCell className="text-right sticky right-0 bg-muted/50 z-10">
                {grandTotal.toLocaleString()}
              </TableCell>
              <TableCell className="sticky right-0 bg-muted/50 z-10"></TableCell> {/* Empty cell for bulk column */}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}