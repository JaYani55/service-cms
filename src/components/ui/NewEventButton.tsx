// A reusable component for the "New Event" button that can be used across pages
import { useNavigate } from "react-router-dom";
import { CalendarPlus } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { usePermissions } from '@/hooks/usePermissions';

export const NewEventButton = () => {
  const { language } = useTheme();
  const { canCreateEvents } = usePermissions();
  const navigate = useNavigate();

  const handleClick = () => {
    if (import.meta.env.DEV) {
      console.log("🔘 New Event button clicked, navigating to /create-event");
    }
    navigate('/create-event');
  };

  if (!canCreateEvents) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className={`
        group flex items-center gap-3 px-2 py-2 rounded-lg
        bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800
        transition-colors
        focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400
        active:scale-[0.98]
      `}
      aria-label={language === "en" ? "New Event" : "Neue Veranstaltung"}
      type="button"
    >
      <span
        className={`
          w-10 h-10 rounded-xl bg-gradient-to-r from-[#21c35d] to-[#17a54b]
          flex items-center justify-center shadow-lg
          transition-transform group-hover:scale-105
        `}
      >
        <CalendarPlus className="h-5 w-5 text-white" />
      </span>
      <span className="text-base font-semibold text-gray-900 dark:text-white">
        {language === "en" ? "New Event" : "Neue Veranstaltung"}
      </span>
    </button>
  );
};