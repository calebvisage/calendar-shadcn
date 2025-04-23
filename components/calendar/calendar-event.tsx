import { CalendarEvent as CalendarEventType } from "@/components/calendar/calendar-types";
import { useCalendarContext } from "@/components/calendar/calendar-context";
import {
  format,
  isSameDay,
  isSameMonth,
  setMinutes,
  getMinutes,
  addMinutes,
  differenceInMinutes,
  setHours,
} from "date-fns";
import { cn } from "@/lib/utils";
import { motion, MotionConfig, AnimatePresence } from "framer-motion";
import React, { useState, useRef, useCallback, useEffect } from "react";

interface EventPosition {
  left: string;
  width: string;
  top: string;
  height: string;
}

function getOverlappingEvents(
  currentEvent: CalendarEventType,
  events: CalendarEventType[]
): CalendarEventType[] {
  return events.filter((event) => {
    if (event.id === currentEvent.id) return false;
    return (
      currentEvent.start < event.end &&
      currentEvent.end > event.start &&
      isSameDay(currentEvent.start, event.start)
    );
  });
}

function calculateEventPosition(
  event: CalendarEventType,
  allEvents: CalendarEventType[]
): EventPosition {
  const overlappingEvents = getOverlappingEvents(event, allEvents);
  const group = [event, ...overlappingEvents].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );
  const position = group.indexOf(event);
  const width = `${100 / (overlappingEvents.length + 1)}%`;
  const left = `${(position * 100) / (overlappingEvents.length + 1)}%`;

  const startHour = event.start.getHours();
  const startMinutes = event.start.getMinutes();

  let endHour = event.end.getHours();
  let endMinutes = event.end.getMinutes();

  if (!isSameDay(event.start, event.end)) {
    endHour = 23;
    endMinutes = 59;
  }

  const topPosition = startHour * 128 + (startMinutes / 60) * 128;
  const duration = endHour * 60 + endMinutes - (startHour * 60 + startMinutes);
  const height = (duration / 60) * 128;

  return {
    left,
    width,
    top: `${topPosition}px`,
    height: `${height}px`,
  };
}

const HOUR_SLOT_HEIGHT = 128;
const MIN_DURATION_MINUTES = 15;

export default function CalendarEvent({
  event,
  month = false,
  className,
}: {
  event: CalendarEventType;
  month?: boolean;
  className?: string;
}) {
  const {
    events,
    setEvents,
    setSelectedEvent,
    setManageEventDialogOpen,
    date,
    mode,
  } = useCalendarContext();
  const style = month ? {} : calculateEventPosition(event, events);

  const isEventInCurrentMonth = isSameMonth(event.start, date);
  const animationKey = `${event.id}-${
    isEventInCurrentMonth ? "current" : "adjacent"
  }`;

  const [isHovering, setIsHovering] = useState(false);
  const [isDraggingHandle, setIsDraggingHandle] = useState<
    "top" | "bottom" | null
  >(null);
  const dragStartY = useRef<number>(0);
  const originalEventTimes = useRef<{ start: Date; end: Date } | null>(null);
  const eventRef = useRef<HTMLDivElement>(null);
  const showTimeBasedFeatures = !month && (mode === "day" || mode === "week");

  const snapToNearest15Minutes = (time: Date): Date => {
    const minutes = getMinutes(time);
    const roundedMinutes = Math.round(minutes / 15) * 15;
    if (roundedMinutes === 60) {
      return addMinutes(setMinutes(time, 0), 60);
    }
    return setMinutes(time, roundedMinutes);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingHandle || !originalEventTimes.current) return;
      const deltaY = e.clientY - dragStartY.current;
      const deltaMinutes = Math.round((deltaY / HOUR_SLOT_HEIGHT) * 60);
      let newStart = originalEventTimes.current.start;
      let newEnd = originalEventTimes.current.end;
      if (isDraggingHandle === "top") {
        newStart = snapToNearest15Minutes(
          addMinutes(originalEventTimes.current.start, deltaMinutes)
        );
        const maxStartTime = addMinutes(
          originalEventTimes.current.end,
          -MIN_DURATION_MINUTES
        );
        if (newStart > maxStartTime) {
          newStart = maxStartTime;
        }
        if (newStart.getDate() !== originalEventTimes.current.start.getDate()) {
          newStart = setMinutes(
            setHours(originalEventTimes.current.start, 0),
            0
          );
        }
      } else {
        newEnd = snapToNearest15Minutes(
          addMinutes(originalEventTimes.current.end, deltaMinutes)
        );
        const minEndTime = addMinutes(
          originalEventTimes.current.start,
          MIN_DURATION_MINUTES
        );
        if (newEnd < minEndTime) {
          newEnd = minEndTime;
        }
        if (
          newEnd.getDate() !== originalEventTimes.current.start.getDate() &&
          differenceInMinutes(newEnd, originalEventTimes.current.start) >
            24 * 60
        ) {
          newEnd = setMinutes(
            setHours(originalEventTimes.current.start, 23),
            59
          );
        }
      }
      setEvents(
        events.map((ev) =>
          ev.id === event.id ? { ...ev, start: newStart, end: newEnd } : ev
        )
      );
    },
    [isDraggingHandle, events, setEvents, event.id]
  );

  const handleMouseUp = useCallback(() => {
    if (isDraggingHandle) {
      setIsDraggingHandle(null);
      originalEventTimes.current = null;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  }, [isDraggingHandle, handleMouseMove]);

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    handle: "top" | "bottom"
  ) => {
    e.stopPropagation();
    setIsDraggingHandle(handle);
    dragStartY.current = e.clientY;
    originalEventTimes.current = { start: event.start, end: event.end };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        <motion.div
          ref={eventRef}
          data-calendar-event="true"
          onMouseEnter={() => showTimeBasedFeatures && setIsHovering(true)}
          onMouseLeave={() => showTimeBasedFeatures && setIsHovering(false)}
          className={cn(
            `px-3 py-1.5 rounded-md truncate cursor-pointer transition-all duration-300 bg-${event.color}-500/10 hover:bg-${event.color}-500/20 border border-${event.color}-500`,
            !month && "absolute",
            showTimeBasedFeatures && "relative",
            isDraggingHandle && "opacity-70 shadow-lg",
            className
          )}
          style={style}
          onClick={(e) => {
            if (!isDraggingHandle && !dragStartY.current) {
              e.stopPropagation();
              setSelectedEvent(event);
              setManageEventDialogOpen(true);
            }
            setTimeout(() => {
              dragStartY.current = 0;
            }, 50);
          }}
          initial={{
            opacity: 0,
            y: -3,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            scale: 0.98,
            transition: {
              duration: 0.15,
              ease: "easeOut",
            },
          }}
          transition={{
            duration: 0.2,
            ease: [0.25, 0.1, 0.25, 1],
            opacity: {
              duration: 0.2,
              ease: "linear",
            },
            layout: {
              duration: 0.2,
              ease: isDraggingHandle ? 0 : "easeOut",
            },
          }}
          layoutId={`event-${animationKey}-${month ? "month" : "day"}`}
        >
          {isHovering && showTimeBasedFeatures && (
            <>
              <div
                data-handle="top"
                onMouseDown={(e) => handleMouseDown(e, "top")}
                className={cn(
                  "absolute top-0 left-1 right-1 h-1.5 cursor-ns-resize bg-primary/50 rounded-t-sm z-10"
                )}
              />
              <div
                data-handle="bottom"
                onMouseDown={(e) => handleMouseDown(e, "bottom")}
                className={cn(
                  "absolute bottom-0 left-1 right-1 h-1.5 cursor-ns-resize bg-primary/50 rounded-b-sm z-10"
                )}
              />
            </>
          )}
          <motion.div
            className={cn(
              `flex flex-col w-full text-${event.color}-500`,
              month && "flex-row items-center justify-between"
            )}
            layout="position"
            transition={{ layout: { duration: isDraggingHandle ? 0 : 0.2 } }}
          >
            <p className={cn("font-bold truncate", month && "text-xs")}>
              {event.title}
            </p>
            <p className={cn("text-sm", month && "text-xs")}>
              <span>{format(event.start, "h:mm a")}</span>
              <span className={cn("mx-1", month && "hidden")}>-</span>
              <span className={cn(month && "hidden")}>
                {format(event.end, "h:mm a")}
              </span>
            </p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}
