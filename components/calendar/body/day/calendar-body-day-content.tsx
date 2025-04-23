import { useCalendarContext } from "../../calendar-context";
import { isSameDay, setHours, setMinutes, addHours } from "date-fns";
import { hours } from "./calendar-body-margin-day-margin";
import CalendarBodyHeader from "../calendar-body-header";
import CalendarEvent from "../../calendar-event";
import React, { useRef } from "react";

export default function CalendarBodyDayContent({ date }: { date: Date }) {
  const { events, setEvents } = useCalendarContext();
  const containerRef = useRef<HTMLDivElement>(null);

  const dayEvents = events.filter((event) => isSameDay(event.start, date));

  const handleTimeslotClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (!containerRef.current) return;
    let targetElement = e.target as HTMLElement | null;
    while (targetElement && targetElement !== containerRef.current) {
      if (targetElement.getAttribute("data-calendar-event")) {
        return;
      }
      targetElement = targetElement.parentElement;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const totalHeight = containerRef.current.scrollHeight;
    const totalMinutesInView = 24 * 60;
    const clickedMinuteOfDay = Math.max(
      0,
      (clickY / totalHeight) * totalMinutesInView
    );
    const hour = Math.floor(clickedMinuteOfDay / 60);
    const minute = Math.round((clickedMinuteOfDay % 60) / 15) * 15;
    let startTime = setMinutes(setHours(date, hour), minute);
    let endTime = addHours(startTime, 1);
    const newEvent = {
      id: crypto.randomUUID(),
      title: "New Event",
      color: "blue",
      start: startTime,
      end: endTime,
    };
    setEvents([...events, newEvent]);
  };

  return (
    <div className="flex flex-col flex-grow">
      <CalendarBodyHeader date={date} />
      <div
        ref={containerRef}
        className="flex-1 relative"
        onClick={handleTimeslotClick}
      >
        {hours.map((hour) => (
          <div key={hour} className="h-32 border-b border-border/50 group" />
        ))}
        {dayEvents.map((event) => (
          <CalendarEvent key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
