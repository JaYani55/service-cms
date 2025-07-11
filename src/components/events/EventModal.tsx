import React, { useState } from 'react';
import { Event } from '../../types/event';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from "sonner";
import { useData } from '../../contexts/DataContext';
import { useMentorRequests } from '@/hooks/useMentorRequests';

interface EventModalProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EventModal: React.FC<EventModalProps> = ({
  event,
  open,
  onOpenChange,
  onSuccess
}) => {
  const { language } = useTheme();
  const { user } = useAuth();
  const { refetchEvents } = useData();
  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [requestsModalOpen, setRequestsModalOpen] = useState(false);

  const { requestToMentor } = useMentorRequests(event, user);

  if (!event) return null;

  const handleRequestClick = async () => {
    if (!event) return;
    setIsRequestLoading(true);

    try {
      await requestToMentor();

      toast.success(
        language === "en"
          ? "Request sent successfully"
          : "Anfrage erfolgreich gesendet"
      );

      await refetchEvents();
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(
        language === "en"
          ? "Failed to send request"
          : "Fehler beim Senden der Anfrage"
      );
    } finally {
      setIsRequestLoading(false);
    }
  };

  return (
    <div>
      {/* Your modal content here */}
      <button onClick={handleRequestClick} disabled={isRequestLoading}>
        {isRequestLoading
          ? language === "en"
            ? "Sending request..."
            : "Anfrage wird gesendet..."
          : language === "en"
          ? "Send request"
          : "Anfrage senden"}
      </button>
    </div>
  );
};

export default EventModal;
