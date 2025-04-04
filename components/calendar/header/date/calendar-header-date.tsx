import { useCalendarContext } from "../../calendar-context";
import { format } from "date-fns";
import CalendarHeaderDateIcon from "./calendar-header-date-icon";
import CalendarHeaderDateChevrons from "./calendar-header-date-chevrons";
import CalendarHeaderDateBadge from "./calendar-header-date-badge";

export default function CalendarHeaderDate() {
  // --- Get mode from context ---
  const { date, mode } = useCalendarContext();

  // --- Determine format based on mode ---
  const titleDateFormat = mode === "year" ? "yyyy" : "MMMM yyyy";

  return (
    <div className="flex items-center gap-2">
      <CalendarHeaderDateIcon />
      <div>
        <div className="flex items-center gap-1">
          {/* --- Use dynamic date format --- */}
          <p className="text-lg font-semibold">
            {format(date, titleDateFormat)}
          </p>
          {/* Hide badge in year view */}
          {mode !== "year" && <CalendarHeaderDateBadge />}
        </div>
        {/* Pass mode down if needed, or let chevrons handle it */}
        <CalendarHeaderDateChevrons />
      </div>
    </div>
  );
}
