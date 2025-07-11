import { MessageSquare } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../ui/button";

export function FloatingFeedbackButton() {
  const { theme, language } = useTheme();
  const { user } = useAuth();
  const feedbackUrl = "https://forms.office.com/e/5hXGXsA6iX";

  const handleClick = () => {
    // Open the feedback form in a new tab
    window.open(feedbackUrl, "_blank", "noopener noreferrer");
  };
  
  // Only render if user is logged in
  if (!user) return null;

  return (
    <div className="fixed left-4 bottom-4 z-50">
      <Button
        variant="default"
        size="default"
        className={`rounded-full shadow-lg ${
          theme === "dark" 
            ? "bg-purple-400 hover:bg-purple-300 text-white" 
            : "bg-purple-300 hover:bg-purple-200 text-purple-900"
        }`}
        onClick={handleClick}
      >
        <MessageSquare className="h-5 w-5 mr-2" />
        <span className="sr-only md:not-sr-only md:inline-flex">
          {language === "en" ? "Feedback" : "Feedback geben"}
        </span>
      </Button>
    </div>
  );
}