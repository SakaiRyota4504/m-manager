'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addCategory(prevState: any, formData: FormData) {
  const supabase = createClient()
  const categoryName = formData.get('categoryName') as string

  if (!categoryName) {
    return { error: 'Category name is required.' }
  }

  const { error } = await supabase.from('categories').insert({ name: categoryName })

  if (error) {
    if (error.code === '23505') {
      return { error: `Category "${categoryName}" already exists.` }
    }
    console.error(error)
    return { error: 'Failed to add category.' }
  }

  revalidatePath('/categories')
  return { success: true }
}

export async function deleteCategory(id: string) {
  const supabase = createClient()

  const { error } = await supabase.from('categories').delete().match({ id })

  if (error) {
    console.error(error)
    return { error: 'Failed to delete category.' }
  }

  revalidatePath('/categories')
  return { success: true }
}

export async function reorderCategories(orderedCategoryIds: string[]) {
  const supabase = createClient()

  const updatePromises = orderedCategoryIds.map(async (id, index) => {
    const { error } = await supabase
      .from('categories')
      .update({ order_index: index })
      .eq('id', id)

    if (error) {
      console.error(`Failed to update order_index for category ${id}:`, error)
      throw new Error(`Failed to update order for category ${id}.`)
    }
  })

  try {
    await Promise.all(updatePromises)
  } catch (e: any) {
    console.error('Reorder Categories Error:', e.message)
    return { error: e.message }
  }

  revalidatePath('/categories')
  revalidatePath('/budgets')
  revalidatePath('/')
  return { success: true }
}

export async function getCategories() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { categories: [], error: '認証が必要です。' };
  }

  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name')
    .order('name', { ascending: true }); // 名前順でソート

  if (error) {
    console.error('DB Error:', error);
    return { categories: [], error: 'カテゴリの取得に失敗しました。' };
  }

  return { categories, error: null };
}