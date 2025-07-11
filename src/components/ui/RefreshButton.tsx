import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/contexts/ThemeContext";

interface RefreshButtonProps {
  onClick: () => Promise<void> | void;
  isLoading?: boolean;
}

export const RefreshButton = ({ onClick, isLoading = false }: RefreshButtonProps) => {
  const { language } = useTheme();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md
              bg-gray-100 hover:bg-gray-200
              text-black font-semibold
              transition-colors
              focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
              active:scale-[0.98]
            `}
            disabled={isLoading}
            aria-label={language === "en" ? "Refresh" : "Aktualisieren"}
            type="button"
          >
            <svg
              className={isLoading ? "animate-spin" : ""}
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#174ea6" // dark blue
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M21 16v5h-5" />
            </svg>
            <span>
              {language === "en" ? "Refresh" : "Aktualisieren"}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {language === "en"
            ? "Get the latest events and updates from the system"
            : "Neueste Veranstaltungen und Änderungen vom System abrufen"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};