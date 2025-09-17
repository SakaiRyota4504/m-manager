'use server';

import { createClient } from "@/lib/supabase/server";

export async function registerHolidays(days: Date[], title: string) {
  try {
    const supabase = createClient();

    // First, delete all existing holidays
    const { error: deleteError } = await supabase.from('schedules').delete().eq('type', 'holiday');
    if (deleteError) {
      throw deleteError;
    }

    if (days.length === 0) {
      // No new holidays to insert
      return { success: true };
    }

    const schedules = days.map((day) => ({
      date: day.toISOString().split('T')[0],
      title,
      type: 'holiday',
    }));

    const { error: insertError } = await supabase.from('schedules').insert(schedules);

    if (insertError) {
      throw insertError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error registering holidays:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getSchedules() {
  const supabase = createClient();
  const { data, error } = await supabase.from('schedules').select('id, title, date, type');

  if (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }

  return data.map(item => ({...item, start: new Date(item.date), end: new Date(item.date)}));
}

export async function getHolidays() {
  const supabase = createClient();
  const { data, error } = await supabase.from('schedules').select('date').eq('type', 'holiday');

  if (error) {
    console.error('Error fetching holidays:', error);
    return [];
  }

  return data.map(item => new Date(item.date));
}
