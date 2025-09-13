'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { addFixedCost, updateFixedCost, deleteFixedCost } from '@/lib/actions/fixed-costs'
import { toast } from 'sonner'

interface Category {
  id: string;
  name: string;
}

interface FixedCost {
  id: string;
  description: string;
  amount: number;
  category_id: string;
  categories: { name: string }; // Nested category name
  recurrence: 'monthly' | 'yearly';
  execution_day: number;
}

interface FixedCostManagerProps {
  fixedCosts: FixedCost[];
  categories: Category[];
}

const initialState = {
  message: null,
  errors: {},
  success: false,
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" aria-disabled={pending}>
      {pending ? (isEdit ? '更新中...' : '追加中...') : (isEdit ? '更新' : '追加')}
    </Button>
  )
}

export function FixedCostManager({ fixedCosts, categories }: FixedCostManagerProps) {
  const [editingFixedCost, setEditingFixedCost] = useState<FixedCost | null>(null)
  const [addState, addFixedCostAction] = useFormState(addFixedCost, initialState)
  const [editState, updateFixedCostAction] = useFormState(updateFixedCost, initialState)

  // Handle toast messages for add operation
  if (addState.success) {
    toast.success(addState.message)
    addState.success = false // Reset success state to prevent re-triggering toast
  } else if (addState.message && !addState.errors) {
    toast.error(addState.message)
    addState.message = null // Reset message state
  }

  // Handle toast messages for edit operation
  if (editState.success) {
    toast.success(editState.message)
    editState.success = false // Reset success state
    setEditingFixedCost(null) // Exit edit mode
  } else if (editState.message && !editState.errors) {
    toast.error(editState.message)
    editState.message = null // Reset message state
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('この固定費を削除してもよろしいですか？')) {
      const { error } = await deleteFixedCost(id)
      if (error) {
        toast.error(error)
      } else {
        toast.success('固定費を削除しました。')
      }
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold mb-4">{editingFixedCost ? '固定費を編集' : '新しい固定費を追加'}</h2>
        <form action={editingFixedCost ? updateFixedCostAction : addFixedCostAction} className="space-y-4">
          {editingFixedCost && <Input type="hidden" name="id" value={editingFixedCost.id} />}
          <div>
            <Label htmlFor="description">内容</Label>
            <Input
              id="description"
              name="description"
              type="text"
              defaultValue={editingFixedCost?.description || ''}
              required
            />
            {editingFixedCost ? editState?.errors?.description && <p className="text-red-500 text-sm">{editState.errors.description}</p> : addState?.errors?.description && <p className="text-red-500 text-sm">{addState.errors.description}</p>}
          </div>
          <div>
            <Label htmlFor="amount">金額</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              defaultValue={editingFixedCost?.amount || ''}
              required
            />
            {editingFixedCost ? editState?.errors?.amount && <p className="text-red-500 text-sm">{editState.errors.amount}</p> : addState?.errors?.amount && <p className="text-red-500 text-sm">{addState.errors.amount}</p>}
          </div>
          <div>
            <Label htmlFor="categoryId">カテゴリ</Label>
            <Select name="categoryId" defaultValue={editingFixedCost?.category_id || ''} required>
              <SelectTrigger>
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {editingFixedCost ? editState?.errors?.categoryId && <p className="text-red-500 text-sm">{editState.errors.categoryId}</p> : addState?.errors?.categoryId && <p className="text-red-500 text-sm">{addState.errors.categoryId}</p>}
          </div>
          <div>
            <Label htmlFor="recurrence">繰り返し周期</Label>
            <Select name="recurrence" defaultValue={editingFixedCost?.recurrence || 'monthly'} required>
              <SelectTrigger>
                <SelectValue placeholder="周期を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">毎月</SelectItem>
                <SelectItem value="yearly">毎年</SelectItem>
              </SelectContent>
            </Select>
            {editingFixedCost ? editState?.errors?.recurrence && <p className="text-red-500 text-sm">{editState.errors.recurrence}</p> : addState?.errors?.recurrence && <p className="text-red-500 text-sm">{addState.errors.recurrence}</p>}
          </div>
          <div>
            <Label htmlFor="executionDay">実行日 (1-31)</Label>
            <Input
              id="executionDay"
              name="executionDay"
              type="number"
              min="1"
              max="31"
              defaultValue={editingFixedCost?.execution_day || ''}
              required
            />
            {editingFixedCost ? editState?.errors?.executionDay && <p className="text-red-500 text-sm">{editState.errors.executionDay}</p> : addState?.errors?.executionDay && <p className="text-red-500 text-sm">{addState.errors.executionDay}</p>}
          </div>
          <div className="flex gap-2">
            <SubmitButton isEdit={!!editingFixedCost} />
            {editingFixedCost && (
              <Button type="button" variant="outline" onClick={() => setEditingFixedCost(null)}>
                キャンセル
              </Button>
            )}
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">登録済みの固定費</h2>
        {fixedCosts.length === 0 ? (
          <p>まだ固定費が登録されていません。</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>内容</TableHead>
                <TableHead>金額</TableHead>
                <TableHead>カテゴリ</TableHead>
                <TableHead>周期</TableHead>
                <TableHead>実行日</TableHead>
                <TableHead className="text-right">アクション</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fixedCosts.map((fixedCost) => (
                <TableRow key={fixedCost.id}>
                  <TableCell>{fixedCost.description}</TableCell>
                  <TableCell>{fixedCost.amount.toLocaleString()}円</TableCell>
                  <TableCell>{fixedCost.categories?.name || '未設定'}</TableCell>
                  <TableCell>{fixedCost.recurrence === 'monthly' ? '毎月' : '毎年'}</TableCell>
                  <TableCell>{fixedCost.execution_day}日</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() => setEditingFixedCost(fixedCost)}
                    >
                      編集
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(fixedCost.id)}
                    >
                      削除
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  )
}
