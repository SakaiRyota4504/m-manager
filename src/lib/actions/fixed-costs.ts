'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const FixedCostSchema = z.object({
  id: z.string().optional(), // Optional for add, required for update
  description: z.string().min(1, '内容を入力してください。'), // name -> description
  amount: z.coerce.number().int().positive('金額は正の数である必要があります。'),
  categoryId: z.string().uuid('カテゴリを選択してください。'),
  recurrence: z.enum(['monthly', 'yearly'], { message: '繰り返し周期を選択してください。' }), // 新規追加
  executionDay: z.coerce.number().int().min(1, '実行日は1以上である必要があります。').max(31, '実行日は31以下である必要があります。'), // dayOfMonth -> executionDay
})

export async function addFixedCost(prevState: any, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { message: '認証が必要です。', success: false }
  }

  const validatedFields = FixedCostSchema.safeParse({
    description: formData.get('description'), // name -> description
    amount: formData.get('amount'),
    categoryId: formData.get('categoryId'),
    recurrence: formData.get('recurrence'), // 新規追加
    executionDay: formData.get('executionDay'), // dayOfMonth -> executionDay
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: '入力内容にエラーがあります。',
      success: false
    }
  }

  const { error } = await supabase.from('fixed_costs').insert({
    description: validatedFields.data.description, // name -> description
    amount: validatedFields.data.amount,
    category_id: validatedFields.data.categoryId,
    recurrence: validatedFields.data.recurrence, // 新規追加
    execution_day: validatedFields.data.executionDay, // day_of_month -> execution_day
    user_id: user.id,
  })

  if (error) {
    console.error('DB Error:', error)
    return { message: '固定費の追加に失敗しました。', success: false }
  }

  revalidatePath('/fixed-costs')
  return { message: '固定費を追加しました。', success: true }
}

export async function updateFixedCost(prevState: any, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { message: '認証が必要です。', success: false }
  }

  const validatedFields = FixedCostSchema.safeParse({
    id: formData.get('id'),
    description: formData.get('description'), // name -> description
    amount: formData.get('amount'),
    categoryId: formData.get('categoryId'),
    recurrence: formData.get('recurrence'), // 新規追加
    executionDay: formData.get('executionDay'), // dayOfMonth -> executionDay
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: '入力内容にエラーがあります。',
      success: false
    }
  }

  const { id, ...updateData } = validatedFields.data;

  const { error } = await supabase.from('fixed_costs').update({
    description: updateData.description, // name -> description
    amount: updateData.amount,
    category_id: updateData.categoryId,
    recurrence: updateData.recurrence, // 新規追加
    execution_day: updateData.executionDay, // day_of_month -> execution_day
  }).eq('id', id).eq('user_id', user.id) // Ensure user can only update their own fixed costs

  if (error) {
    console.error('DB Error:', error)
    return { message: '固定費の更新に失敗しました。', success: false }
  }

  revalidatePath('/fixed-costs')
  return { message: '固定費を更新しました。', success: true }
}

export async function deleteFixedCost(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: '認証が必要です。' }
  }

  const { error } = await supabase.from('fixed_costs').delete().eq('id', id).eq('user_id', user.id)

  if (error) {
    console.error('DB Error:', error)
    return { error: '固定費の削除に失敗しました。' }
  }

  revalidatePath('/fixed-costs')
  return { success: true }
}

export async function getFixedCosts() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { fixedCosts: [], error: '認証が必要です。' };
  }

  const { data: fixedCosts, error } = await supabase
    .from('fixed_costs')
    .select('*, categories(name)') // カテゴリ名も取得
    .eq('user_id', user.id)
    .order('execution_day', { ascending: true });

  if (error) {
    console.error('DB Error:', error);
    return { fixedCosts: [], error: '固定費の取得に失敗しました。' };
  }

  return { fixedCosts, error: null };
}