'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { addTransaction, updateTransaction } from '@/lib/actions/transactions' // Import updateTransaction
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CategoryRadioGroup } from '@/components/CategoryRadioGroup'
import { cn } from '@/lib/utils'
import { Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

type Category = {
  id: string
  name: string
}

type Transaction = {
  id: string
  date: string
  amount: number
  description: string | null
  category_id: string | null
}

interface TransactionFormProps {
  categories: Category[]
  initialTransaction?: Transaction // Optional initial transaction for editing
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (isEditing ? '更新中...' : '保存中...') : (isEditing ? '更新' : '保存')}
    </Button>
  )
}

export function TransactionForm({ categories, initialTransaction }: TransactionFormProps) {
  const isEditing = !!initialTransaction;
  const action = isEditing ? updateTransaction : addTransaction;

  const initialState = { message: null, errors: {}, success: false }
  const [state, formAction] = useFormState(action, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const [date, setDate] = useState<Date | undefined>(
    initialTransaction ? new Date(initialTransaction.date) : new Date()
  )
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(
    initialTransaction?.category_id || undefined
  );

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message)
        if (!isEditing) { // Only reset form for new transactions
          formRef.current?.reset()
          setDate(new Date())
          setSelectedCategoryId(undefined);
        }
      } else {
        toast.error(state.message)
      }
    }
  }, [state, isEditing])

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {isEditing && <input type="hidden" name="id" value={initialTransaction.id} />}

      {/* Date Picker */}
      <div className="space-y-2">
        <label htmlFor="date" className="text-sm font-medium">日付</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: ja }) : <span>日付を選択</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <input type="hidden" name="date" value={date?.toISOString()} />
      </div>

      {/* Category Select */}
      <div className="space-y-2">
        <label htmlFor="categoryId" className="text-sm font-medium">カテゴリ</label>
        <CategoryRadioGroup
          categories={categories}
          name="categoryId"
          defaultValue={initialTransaction?.category_id || undefined}
          onValueChange={setSelectedCategoryId}
        />
        {state.errors?.categoryId && <p className="text-sm font-medium text-destructive">{state.errors.categoryId[0]}</p>}
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <label htmlFor="amount" className="text-sm font-medium">金額</label>
        <Input
          name="amount"
          type="number"
          placeholder="0"
          required
          defaultValue={initialTransaction?.amount || ''}
        />
        {state.errors?.amount && <p className="text-sm font-medium text-destructive">{state.errors.amount[0]}</p>}
      </div>

      {/* Description Input */}
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">内容 (任意)</label>
        <Input
          name="description"
          placeholder="スーパーでの買い物..."
          defaultValue={initialTransaction?.description || ''}
        />
      </div>

      <SubmitButton isEditing={isEditing} />
    </form>
  )
}
