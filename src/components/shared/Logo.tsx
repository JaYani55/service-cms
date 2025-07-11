import { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { Loader2 } from "lucide-react";

const Logo = ({ className = "" }: { className?: string }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  
  // Use direct URLs since they're already public URLs
  const logoUrl = theme === "dark" 
    ? "https://nesonoyxwsgodyilmrlq.supabase.co/storage/v1/object/public/Logos/Inklusolutions/MentorBookingDarkMode.png"
    : "https://nesonoyxwsgodyilmrlq.supabase.co/storage/v1/object/public/Logos/Inklusolutions/MentorBooking.png";
  
  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin" />;
  }
  
  return (
    <img 
      src={logoUrl} 
      alt="Mentor-Booking Logo" 
      className={`h-8 ${className}`}
      onError={() => {
        console.error("Error loading logo");
        // Fallback to text if image fails to load
        setLoading(false);
      }}
    />
  );
};

export default Logo;