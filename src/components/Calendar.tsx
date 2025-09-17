"use client";

import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useEffect, useState } from "react";
import { getSchedules } from "@/lib/actions/schedules";
import "moment/locale/ja";

moment.locale("ja");
const localizer = momentLocalizer(moment);

const formats = {
  monthHeaderFormat: "YYYY年MM月",
};

export default function Calendar() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchSchedules = async () => {
      const schedules = await getSchedules();
      setEvents(schedules as any);
    };
    fetchSchedules();
  }, []);

  const eventPropGetter = (event: any) => {
    const style = {
      backgroundColor: event.type === 'holiday' ? '#ef4444' : '#3b82f6',
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    };
    return { style };
  };

  return (
    <div>
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        eventPropGetter={eventPropGetter}
        formats={formats}
      />
    </div>
  );
}
