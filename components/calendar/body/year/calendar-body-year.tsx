import { useCalendarContext } from "../../calendar-context";
import {
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday as checkIsToday,
} from "date-fns";
import { cn } from "@/lib/utils";
import React from "react";

const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

export default function CalendarBodyYear() {
  const { date, setDate, setMode, events } = useCalendarContext();

  const yearStart = startOfYear(date);
  const yearEnd = endOfYear(date);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  // Create a Set of dates with events for quick lookup
  const eventDays = React.useMemo(() => {
    const daysWithEvents = new Set<string>();
    events.forEach((event) => {
      daysWithEvents.add(format(event.start, "yyyy-MM-dd"));
      // Add end date as well if it's different day (for multi-day events indication)
      if (!isSameDay(event.start, event.end)) {
        daysWithEvents.add(format(event.end, "yyyy-MM-dd"));
      }
      // Potentially add days in between for multi-day events if needed
    });
    return daysWithEvents;
  }, [events]);

  const handleMonthClick = (monthDate: Date) => {
    setDate(monthDate);
    setMode("month");
  };

  return (
    <div className="flex-grow overflow-y-auto p-4">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {months.map((monthDate) => {
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);
          const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
          const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
          const calendarDays = eachDayOfInterval({
            start: calendarStart,
            end: calendarEnd,
          });

          return (
            <div
              key={monthDate.toISOString()}
              className="rounded-lg border bg-card p-3 shadow-sm"
            >
              <h3
                className="mb-2 cursor-pointer text-center font-semibold text-primary hover:underline"
                onClick={() => handleMonthClick(monthDate)}
              >
                {format(monthDate, "MMMM")}
              </h3>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
                {weekDays.map((day, index) => (
                  <div key={`${day}-${index}`}>{day}</div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const isCurrentMonth = isSameMonth(day, monthDate);
                  const isToday = checkIsToday(day);
                  const hasEvent = eventDays.has(format(day, "yyyy-MM-dd"));

                  // Adjust for week starting on Monday (0=Sun, 1=Mon, ..., 6=Sat) -> getDay returns 0 for Sunday
                  // We don't strictly need this logic here as eachDayOfInterval handles the grid structure correctly,
                  // but kept for clarity if manual layout was needed.

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-xs transition-colors",
                        !isCurrentMonth && "text-muted-foreground/50",
                        isCurrentMonth && "hover:bg-accent",
                        isToday &&
                          "bg-primary font-semibold text-primary-foreground hover:bg-primary/90",
                        !isToday &&
                          hasEvent &&
                          "relative after:absolute after:bottom-0.5 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-destructive" // Event indicator dot
                        // Alternative: Use background color for events
                        // hasEvent && !isToday && 'bg-blue-100 dark:bg-blue-900/50',
                      )}
                      onClick={() => {
                        setDate(day);
                        setMode("day");
                      }}
                      title={format(day, "PPP")} // Tooltip with full date
                    >
                      {format(day, "d")}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
