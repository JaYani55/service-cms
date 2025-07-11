import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { Card } from "@/components/ui/card";
import { useTheme } from "../contexts/ThemeContext";
import { Event } from '../types/event';
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { UserRound } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { useNavigate } from "react-router-dom";
import { NewEventButton } from "@/components/ui/NewEventButton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import { getEventTimeDisplay } from '@/utils/timeUtils';
import { RefreshButton } from "@/components/ui/RefreshButton";
import { DayEventList } from "@/components/calendar/DayEventList";
import { ensureProductGradient } from "@/services/events/productService";

// Helper to extract the first color from a linear-gradient string
function getDotColor(product) {
  if (product?.gradient) {
    const match = product.gradient.match(/#([0-9a-fA-F]{3,6})/);
    if (match) return match[0];
  }
  // fallback color
  return "#91a1c9";
}

const Calendar = () => {
  const navigate = useNavigate();
  const { language } = useTheme();
  const { events, isLoadingEvents, refetchEvents } = useData();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [requestsModalOpen, setRequestsModalOpen] = useState(false);

  const { eventsByDate, getEventsBySelectedDate } = useCalendarEvents(events || []);

  const previousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEventClick = (event: Event, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    navigate(`/events/${event.id}`, { 
      state: { from: '/calendar' } 
    });
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const dayNames = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(2021, 0, i + 1);
    return format(date, language === "en" ? "EEE" : "EEE");
  });

  const selectedDateEvents = getEventsBySelectedDate(selectedDate);

  const handleModalSuccess = () => {
    refetchEvents();
    setRequestsModalOpen(false);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 w-full fade-in">
        <div className="flex justify-between items-center mb-6">
          {/* REMOVE THIS TITLE */}
          {/* <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
            {language === "en" ? "Calendar" : "Kalender"}
          </h1> */}
          <div className="flex gap-3">
            <RefreshButton 
              onClick={refetchEvents} 
              isLoading={isLoadingEvents} 
            />
            <NewEventButton />
          </div>
        </div>
        
        <Card className="p-6 w-full glass">
          <CalendarHeader 
            currentMonth={currentMonth}
            onPreviousMonth={previousMonth}
            onNextMonth={nextMonth}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar grid */}
            <div className="col-span-2">
              <div className="grid grid-cols-7 gap-px bg-border">
                {daysInMonth.map((day) => {
                  const dateString = format(day, "yyyy-MM-dd");
                  const dayEvents = eventsByDate[dateString] || [];
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isSelected = isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);

                  return (
                    <div
                      key={dateString}
                      onClick={() => handleDayClick(day)}
                      className={`
                        aspect-square min-h-[90px] p-2 border border-border bg-white
                        transition-colors cursor-pointer
                        ${!isCurrentMonth ? "opacity-40 bg-muted/30" : ""}
                        ${isSelected ? "bg-primary/10 border-primary" : ""}
                        ${isTodayDate ? "bg-accent/30 border-accent-foreground" : ""}
                        hover:bg-accent/10
                      `}
                      style={{ borderRadius: 0 }}
                    >
                      <div className={`text-right font-medium mb-2 ${isTodayDate ? "text-primary font-bold" : ""}`}>
                        {format(day, "d")}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {dayEvents.map((event) => {
                          const product = event.ProductInfo;
                          let color = getDotColor(product);
                          return (
                            <span
                              key={event.id}
                              className="inline-block w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: color }}
                              title={product?.name}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Events for selected day */}
            <div className="col-span-1">
              <DayEventList
                events={selectedDateEvents}
                onEventClick={handleEventClick}
                language={language}
              />
            </div>
          </div>
        
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default Calendar;
