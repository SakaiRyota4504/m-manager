'use client';

import { useEffect, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { getHolidays, registerHolidays } from '@/lib/actions/schedules';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function HolidayManager() {
  const [days, setDays] = useState<Date[] | undefined>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHolidays = async () => {
      const holidays = await getHolidays();
      setDays(holidays);
    };
    fetchHolidays();
  }, []);

  const handleRegister = async () => {
    setLoading(true);
    const result = await registerHolidays(days || [], 'Holiday');
    setLoading(false);

    if (result.success) {
      toast.success('Successfully updated holidays.');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center">
      <DayPicker
        mode="multiple"
        selected={days}
        onSelect={setDays}
        formatters={{
          formatCaption: (date) => format(date, 'yyyy年MM月', { locale: ja }),
        }}
      />
      <Button onClick={handleRegister} disabled={loading}>
        {loading ? 'Updating...' : 'Update Holidays'}
      </Button>
    </div>
  );
}
