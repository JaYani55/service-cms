import { Event } from "@/types/event";
import { Card } from "@/components/ui/card";
import { UserRound } from "lucide-react";
import { getIconByName } from "@/constants/pillaricons";

interface DayEventListProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  language: string;
}

export const DayEventList = ({ events, onEventClick, language }: DayEventListProps) => (
  <Card className="p-4 h-full">
    <h3 className="text-lg font-semibold mb-4">
      {language === "en" ? "Events for this day" : "Veranstaltungen an diesem Tag"}
    </h3>
    {events.length === 0 ? (
      <div className="text-muted-foreground text-sm">
        {language === "en" ? "No events" : "Keine Veranstaltungen"}
      </div>
    ) : (
      <ul className="space-y-3">
        {events.map(event => {
          const product = event.ProductInfo;
          // Extract the first color from the gradient for the dot
          let color = "#91a1c9";
          if (product?.gradient) {
            const match = product.gradient.match(/#([0-9a-fA-F]{3,6})/);
            if (match) color = match[0];
          }
          // Get the icon URL (fallback to a default if missing)
          const iconUrl = product?.icon_name
            ? getIconByName(product.icon_name)
            : getIconByName("balloon");

          return (
            <li
              key={event.id}
              className="p-5 border-b last:border-b-0 cursor-pointer hover:bg-muted/20 transition flex items-center gap-5"
              onClick={() => onEventClick(event)}
            >
              {/* Product avatar: icon on colored/gradient circle */}
              <span
                className="relative flex-shrink-0"
                title={product?.name}
                style={{ width: 48, height: 48, display: "inline-block" }}
              >
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: product?.gradient || color,
                    width: "100%",
                    height: "100%",
                    display: "block",
                  }}
                />
                <img
                  src={iconUrl}
                  alt={product?.name || "Product icon"}
                  className="relative w-8 h-8 m-auto top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "transparent",
                  }}
                />
              </span>
              {/* Event info */}
              <div className="flex flex-col justify-center min-w-0">
                <div className="font-semibold text-lg truncate">{event.company}</div>
                <div className="text-base text-muted-foreground">{event.time}</div>
                <div className="flex items-center gap-2 text-base mt-2">
                  <UserRound className="h-5 w-5" />
                  <span className="truncate">{event.primaryStaffName || event.staffNames?.[0] || 'No coach assigned'}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    )}
  </Card>
);