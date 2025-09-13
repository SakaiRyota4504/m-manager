'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const TransactionSchema = z.object({
  date: z.string().pipe(z.coerce.date()),
  amount: z.coerce.number().int().positive('金額は正の数である必要があります。'),
  description: z.string().optional(),
  categoryId: z.string().uuid('カテゴリを選択してください。'),
})

export async function addTransaction(prevState: any, formData: FormData) {
  const supabase = createClient()

  const validatedFields = TransactionSchema.safeParse({
    date: formData.get('date'),
    amount: formData.get('amount'),
    description: formData.get('description'),
    categoryId: formData.get('categoryId'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: '入力内容にエラーがあります。'
    }
  }

  const { error } = await supabase.from('transactions').insert({
    date: validatedFields.data.date.toISOString(),
    amount: validatedFields.data.amount,
    description: validatedFields.data.description,
    category_id: validatedFields.data.categoryId,
  })

  if (error) {
    console.error('DB Error:', error)
    return { message: 'データベースへの保存に失敗しました。' }
  }

  // Revalidate pages that show transaction data
  revalidatePath('/') 
  revalidatePath('/new-transaction')
  
  return { success: true, message: '取引を保存しました。' }
}

export async function updateTransaction(prevState: any, formData: FormData) {
  const supabase = createClient()

  const id = formData.get('id') as string; // Assuming ID is passed for update

  const validatedFields = TransactionSchema.safeParse({
    date: formData.get('date'),
    amount: formData.get('amount'),
    description: formData.get('description'),
    categoryId: formData.get('categoryId'),
  })

  if (!validatedFields.success) {
    console.error(validatedFields.error.flatten().fieldErrors)
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: '入力内容にエラーがあります。'
    }
  }

  const { error } = await supabase.from('transactions').update({
    date: validatedFields.data.date.toISOString(),
    amount: validatedFields.data.amount,
    description: validatedFields.data.description,
    category_id: validatedFields.data.categoryId,
  }).eq('id', id) // Update where ID matches

  if (error) {
    console.error('DB Error:', error)
    return { message: 'データベースの更新に失敗しました。' }
  }

  revalidatePath('/') // Revalidate dashboard page
  revalidatePath(`/transactions/${id}/edit`) // Revalidate the edit page
  return { success: true, message: '取引を更新しました。' }
}
