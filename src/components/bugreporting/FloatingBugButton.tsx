import { useState } from "react";
import { Bug } from "lucide-react";
import { BugReportModal } from "./BugReportModal";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../ui/button";

export function FloatingBugButton() {
  const { theme, language } = useTheme();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Only render if user is logged in
  if (!user) return null;

  return (
    <>
      <div className="fixed right-4 bottom-4 z-50">
        <Button
          variant="default"
          size="default"
          className={`rounded-full shadow-lg ${
            theme === "dark" 
              ? "bg-amber-600 hover:bg-amber-500 text-white" 
              : "bg-amber-500 hover:bg-amber-400 text-white"
          }`}
          onClick={() => setIsOpen(true)}
        >
          <Bug className="h-5 w-5 mr-2" />
          <span className="sr-only md:not-sr-only md:inline-flex">
            {language === "en" ? "Report Bug" : "Bug melden"}
          </span>
        </Button>
      </div>

      {/* Use the existing BugReportModal but control its open state */}
      {isOpen && <BugReportModal onClose={() => setIsOpen(false)} />}
    </>
  );
}