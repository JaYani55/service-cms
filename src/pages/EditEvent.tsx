import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions'; // Add this import
import { useTheme } from '../contexts/ThemeContext';
import { EventForm } from '../components/events/EventForm';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { getEmployerById } from '@/services/employer/employerService';
import { useData } from '../contexts/DataContext'; 
import { calculateEndTime } from '@/utils/timeUtils';
import { calculateEventStatus } from '../utils/eventUtils';
import { fetchProductById } from '@/services/events/productService';

const EditEvent = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useTheme();
  const { getEventById, refetchEvents } = useData();
  const { user } = useAuth();
  const permissions = usePermissions(); // Use centralized permissions
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [eventData, setEventData] = useState<any>(null);
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Permission check: Use centralized permission instead of role checks
  useEffect(() => {
    if (user && !permissions.canEditEvents) {
      navigate('/events');
    }
  }, [user, navigate, permissions.canEditEvents]);
  
  // Store the referrer in session storage when component mounts
  useEffect(() => {
    // Get the referrer from state passed by the navigation, or use pathname
    const referrer = location.state?.from || 
                    sessionStorage.getItem('eventReferrer') || 
                    '/events';
    
    // Store it for the detail page to use later
    sessionStorage.setItem('eventReferrer', referrer);
  }, [location]);
  
  // Fetch event data directly to ensure we have the latest data
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        setIsLoadingEvent(false);
        return;
      }
      
      setIsLoadingEvent(true);
      try {
        // First try to get from cache
        let eventData = getEventById(id);
        
        // If not in cache, fetch directly from database
        if (!eventData) {
          const { data, error } = await supabase
            .from('mentorbooking_events')
            .select('*')
            .eq('id', id)
            .single();
            
          if (error) throw error;
          eventData = data;
        }
        
        // Transform event data for form
        setEventData({
          ...eventData,
          // Ensure all required fields are present
          employer_id: eventData.employer_id || "",
          company: eventData.company || "",
          date: eventData.date || "",
          time: eventData.time || "",
          description: eventData.description || "",
          staff_members: eventData.staff_members || [],
          status: eventData.status || "new",
          mode: eventData.mode || 'online',
          amount_requiredmentors: eventData.amount_requiredmentors || 1,
          product_id: eventData.product_id || undefined,
          teams_link: eventData.teams_link || "",
        });
      } catch (error) {
        console.error("Error loading event:", error);
        toast.error(
          language === 'en' 
            ? 'Failed to load event' 
            : 'Fehler beim Laden der Veranstaltung'
        );
      } finally {
        setIsLoadingEvent(false);
      }
    };
    
    fetchEvent();
  }, [id, getEventById, language]);

  const handleSubmit = async (values: any) => {
    setIsLoading(true);
    try {
      // Handle staff members properly
      const staffMembers = values.staff_members && values.staff_members.length > 0 
        ? values.staff_members 
        : [];
    
      // Get company name from the selected employer before submitting
      let companyName = "";
      if (values.employer_id) {
        try {
          const employerData = await getEmployerById(values.employer_id);
          companyName = employerData?.name || values.company || "";
        } catch (err) {
          console.error("Error fetching employer:", err);
          companyName = values.company || "";
        }
      }
      
      // Calculate end time based on start time and duration
      const end_time = calculateEndTime(values.time, values.duration_minutes);
      
      // Get the current event to calculate status properly
      const currentEvent = getEventById(id);
      
      // Use locked status if specified, otherwise calculate
      const newStatus = values.status === 'locked' ? 'locked' : 
                       (currentEvent ? calculateEventStatus({
                          ...currentEvent,
                          amount_requiredmentors: values.amount_requiredmentors,
                       }) : 'new');
      
      // Get product details if a product is selected
      let productInfo = null;
      if (values.product_id) {
        const productDetails = await fetchProductById(values.product_id);
        if (productDetails) {
          productInfo = {
            id: productDetails.id,
            name: productDetails.name,
            icon_name: productDetails.icon_name,
            gradient: productDetails.gradient,
            description_de: productDetails.description_de,
            description_effort: productDetails.description_effort,
          };
        }
      }
      
      const { error } = await supabase
        .from('mentorbooking_events')
        .update({
          employer_id: values.employer_id,
          company: companyName,
          date: values.date,
          time: values.time,
          end_time: end_time,
          duration_minutes: values.duration_minutes,
          description: values.description,
          staff_members: staffMembers,
          status: newStatus,
          mode: values.mode || 'online',
          amount_requiredmentors: values.amount_requiredmentors,
          product_id: values.product_id || null,
          ProductInfo: productInfo,
          teams_link: values.teams_link || "",
        })
        .eq('id', id);

      if (error) throw error;

      // Mark submission as successful
      setIsSubmitSuccessful(true);
      
      // Refresh the cache after successful update
      await refetchEvents();
      
      toast.success(
        language === 'en' 
          ? 'Event updated successfully' 
          : 'Veranstaltung erfolgreich aktualisiert'
      );
      
      // Navigate with a slight delay to allow the toast to be seen
      setTimeout(() => {
        navigate(`/events/${id}`, { 
          state: { from: sessionStorage.getItem('eventReferrer') } 
        });
      }, 500);
    } catch (error: any) {
      console.error("Error updating event:", error);
      toast.error(
        language === 'en' 
          ? error.message || 'Failed to update event' 
          : 'Fehler beim Aktualisieren der Veranstaltung'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingEvent) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!eventData && !isLoadingEvent) {
    return (
      <div className="p-4">
        <p className="text-center text-red-500">
          {language === 'en' ? 'Event not found' : 'Veranstaltung nicht gefunden'}
        </p>
        <div className="flex justify-center mt-4">
          <Button onClick={() => navigate('/events')}>
            {language === 'en' ? 'Back to Events' : 'Zurück zu Veranstaltungen'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === "en" ? "Back" : "Zurück"}
        </Button>
      </div>
    
      <EventForm
        initialValues={eventData}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        mode="edit"
      />
    </div>
  );
};

export default EditEvent;