'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { addCategory, deleteCategory, reorderCategories } from '@/lib/actions/categories'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
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
import { ArrowDown, ArrowUp } from 'lucide-react' // Import icons

type Category = {
  id: string
  name: string
  created_at: string
  order_index: number // Add order_index
}

interface CategoryManagerProps {
  initialCategories: Category[]
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? '追加中...' : '追加'}
    </Button>
  )
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [state, formAction] = useFormState(addCategory, { error: undefined, success: undefined })
  const formRef = useRef<HTMLFormElement>(null)
  const [categories, setCategories] = useState(initialCategories) // Manage categories locally

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
    if (state.success) {
      toast.success("カテゴリを追加しました。")
      formRef.current?.reset()
    }
  }, [state])

  // Update local categories when initialCategories prop changes (e.g., after revalidate)
  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])


  const handleDelete = async (id: string) => {
    const result = await deleteCategory(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("カテゴリを削除しました。")
    }
  }

  const handleReorder = async (categoryId: string, direction: 'up' | 'down') => {
    const currentCategoryIndex = categories.findIndex(cat => cat.id === categoryId)
    if (currentCategoryIndex === -1) return

    const newCategories = [...categories]
    const categoryToMove = newCategories[currentCategoryIndex]

    let targetIndex = -1
    if (direction === 'up' && currentCategoryIndex > 0) {
      targetIndex = currentCategoryIndex - 1
    } else if (direction === 'down' && currentCategoryIndex < newCategories.length - 1) {
      targetIndex = currentCategoryIndex + 1
    }

    if (targetIndex !== -1) {
      // Swap categories
      newCategories.splice(currentCategoryIndex, 1) // Remove from current position
      newCategories.splice(targetIndex, 0, categoryToMove) // Insert at target position

      setCategories(newCategories) // Optimistic UI update

      const orderedIds = newCategories.map(cat => cat.id)
      const result = await reorderCategories(orderedIds)

      if (result.error) {
        toast.error(result.error)
        setCategories(initialCategories) // Revert on error
      } else {
        toast.success("カテゴリの並び順を更新しました。")
      }
    }
  }

  return (
    <div className="space-y-6">
      <form ref={formRef} action={formAction} className="flex items-center space-x-2">
        <Input
          name="categoryName"
          placeholder="新しいカテゴリ名"
          required
          className="max-w-xs"
        />
        <SubmitButton />
      </form>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>カテゴリ名</TableHead>
              <TableHead className="text-right w-[150px]">操作</TableHead> {/* Increased width */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category, index) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="text-right flex items-center justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReorder(category.id, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReorder(category.id, 'down')}
                    disabled={index === categories.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                  >
                    削除
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

