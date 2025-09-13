'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateBudget({
  year,
  month,
  categoryId,
  amount,
}: {
  year: number
  month: number
  categoryId: string
  amount: number
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Authentication required.' }
  }

  // year_month is the last day of the month
  const year_month = new Date(year, month, 0).toISOString()

  const { error } = await supabase.from('budgets').upsert(
    {
      user_id: user.id,
      category_id: categoryId,
      year_month: year_month,
      amount: amount,
    },
    {
      onConflict: 'user_id,category_id,year_month',
    }
  )

  if (error) {
    console.error('Update Budget Error:', error)
    return { error: 'Failed to update budget.' }
  }

  revalidatePath('/budgets')
  return { success: true }
}

export async function bulkUpdateBudgets({
  year,
  categoryId,
  amount,
}: {
  year: number
  categoryId: string
  amount: number
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Authentication required.' }
  }

  const updates = []
  for (let month = 1; month <= 12; month++) {
    const year_month = new Date(year, month, 0).toISOString() // Last day of the month
    updates.push({
      user_id: user.id,
      category_id: categoryId,
      year_month: year_month,
      amount: amount,
    })
  }

  const { error } = await supabase.from('budgets').upsert(updates, { onConflict: 'user_id,category_id,year_month' })

  if (error) {
    console.error('Bulk Update Budget Error:', error)
    return { error: 'Failed to bulk update budget.' }
  }

  revalidatePath('/budgets')
  return { success: true }
}
