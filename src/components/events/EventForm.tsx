import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from '../../contexts/AuthContext';
import { EventStatus, EventMode } from '@/types/event';
import { format } from 'date-fns';
import { fetchProducts, fetchProductById, Product } from '../../services/events/productService';
import { CompanyCombobox } from "./CompanyCombobox";
import { testDirectEmployerQuery } from "../../services/employer/employerService";
import { searchEmployers } from "../../services/employer/employerService";
import { StaffCombobox } from "./StaffCombobox"; // Use StaffCombobox instead of CoachCombobox
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Check, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { ProductCombobox } from "./ProductCombobox";
import { TimePicker } from '@/components/events/time-picker';
import { DurationPicker } from '@/components/events/duration-picker';
import { calculateEndTime } from '@/utils/timeUtils';
import { PastEventWarningDialog } from './PastEventWarningDialog';
import { ProductApprovedMentorSelector } from "./ProductApprovedMentorSelector";
import { ProductSection } from "./EventFormSections/ProductSection";
import { StaffSection } from "./EventFormSections/StaffSection";
import { ProductApprovedMentorSelectSection } from "./EventFormSections/ProductApprovedMentorSelectSection";
import { CompanySection } from "./EventFormSections/CompanySection";
import { DateTimeSection } from "./EventFormSections/DateTimeSection";
import { AdditionalInfoAndLinkSection } from "./EventFormSections/AdditionalInfoAndLinkSection";
import { LockAndMentorCountSection } from "./EventFormSections/LockAndMentorCountSection";
import { FooterSection } from "./EventFormSections/FooterSection";
import { Sparkles, Users, Building2, CalendarDays, Info, LockKeyhole } from "lucide-react";

// Update the form schema to remove past date validation
const formSchema = zod.object({
  employer_id: zod.string().min(1, { message: "Company is required" }),
  company: zod.string().min(1, { message: "Company name is required" }),
  date: zod.string().min(1, { message: "Date is required" }), // Remove the .refine() validation
  time: zod.string().min(1, { message: "Time is required" }),
  duration_minutes: zod.number().min(1, { message: "Duration is required" }),
  description: zod.string().optional(),
  status: zod.enum(['new', 'firstRequests', 'successPartly', 'successComplete', 'locked']),
  mode: zod.enum(['live', 'online', 'hybrid']).optional(),
  amount_requiredmentors: zod.number().min(1, { message: "At least one mentor is required" }),
  product_id: zod.number().optional(),
  staff_members: zod.array(zod.string()).min(1, { message: "At least one staff member is required" }),
  teams_link: zod.string().optional(),
  initial_selected_mentors: zod.array(zod.string()).optional(),
  ProductInfo: zod.object({
    id: zod.number(),
    name: zod.string(),
    icon_name: zod.string().optional(),
    gradient: zod.string().optional(),
    description_de: zod.string(),
    description_effort: zod.string(),
  }).optional(),
});

type FormValues = zod.infer<typeof formSchema>;

interface EventFormProps {
  initialValues?: {
    id?: string;
    employer_id?: string;
    company?: string;
    date?: string;
    time?: string;
    end_time?: string;
    duration_minutes?: number;
    description?: string;
    status?: EventStatus;
    mode?: EventMode;
    amount_requiredmentors?: number;
    product_id?: number;
    staff_members?: string[];
    teams_link?: string;
    initial_selected_mentors?: string[];
  };
  onSubmit: (values: FormValues) => Promise<void>;
  isLoading: boolean;
  mode: 'create' | 'edit';
}

export const EventForm: React.FC<EventFormProps> = ({
  initialValues,
  onSubmit,
  isLoading,
  mode
}) => {
  const { language, theme } = useTheme();
  const { isSuperAdmin } = useAuth();
  const [Products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLocked, setIsLocked] = useState<boolean>(initialValues?.status === 'locked');
  const [previousStatus, setPreviousStatus] = useState<EventStatus>(initialValues?.status || 'new');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [groupNames, setGroupNames] = useState<Record<string, string>>({});
  
  // Add a new state for approved mentor names
  const [approvedMentorNames, setApprovedMentorNames] = useState<{id: string, name: string}[]>([]);
  
  // Create form with defaults
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employer_id: "",
      company: "",
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '09:00',
      duration_minutes: 60,
      description: '',
      status: 'new',
      mode: 'online',
      amount_requiredmentors: 1,
      product_id: undefined,
      staff_members: [], // Only this field
      teams_link: "",
      initial_selected_mentors: [],
    }
  });

  const isDirty = form.formState.isDirty;

  // Watch the mode field to conditionally show Teams link
  const selectedMode = form.watch('mode');
  const showTeamsLink = selectedMode === 'online' || selectedMode === 'hybrid';

  // Warn about unsaved changes
  useEffect(() => {
    const warnUnsavedChanges = (e: BeforeUnloadEvent) => {
      if (isDirty && !isLoading) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', warnUnsavedChanges);
    return () => window.removeEventListener('beforeunload', warnUnsavedChanges);
  }, [isDirty, isLoading]);

  // Load Products once
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true);
      const data = await fetchProducts();
      setProducts(data);
      setIsLoadingProducts(false);
    };
    
    loadProducts();
  }, []);
  
  // Conditional debugging for initialValues
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("EventForm initialValues:", initialValues);
    }
  }, [initialValues]);

  // Set form values when initialValues change
  useEffect(() => {
    if (!initialValues) return;

    try {
      if (import.meta.env.DEV) {
        console.log("EventForm initializing with values:", initialValues);
        console.log("Product ID from initialValues:", initialValues.product_id, typeof initialValues.product_id);
      }
      
      // Only include the fields that are actually in your initialValues type
      const formValues = {
        employer_id: initialValues.employer_id || "",
        company: initialValues.company || "",
        date: initialValues.date || format(new Date(), 'yyyy-MM-dd'),
        time: initialValues.time || '09:00',
        description: initialValues.description || '',
        status: initialValues.status || 'new',
        mode: initialValues.mode || 'online',
        amount_requiredmentors: 
          initialValues.amount_requiredmentors != null
            ? Number(initialValues.amount_requiredmentors)
            : 7,
        product_id: initialValues.product_id !== undefined ? Number(initialValues.product_id) : undefined,
        staff_members: initialValues.staff_members || [],
        teams_link: initialValues.teams_link || "",
        duration_minutes: initialValues.duration_minutes || 60,
        initial_selected_mentors: initialValues.initial_selected_mentors || [],
      };
      
      if (import.meta.env.DEV) {
        console.log("Setting form values:", formValues);
      }
      
      // Reset the form with a small delay
      setTimeout(() => {
        form.reset(formValues);
        
        if (import.meta.env.DEV) {
          console.log("Form values after reset:", form.getValues());
        }
        
        // Also explicitly set isLocked based on status
        setIsLocked(formValues.status === 'locked');
        setPreviousStatus(formValues.status === 'locked' ? 'new' : formValues.status);
      }, 50);
    } catch (error) {
      console.error("Error setting form values:", error);
      console.error("Problem initialValues:", initialValues);
    }
  }, [initialValues, form]);
    
  // Track previous status for lock/unlock functionality
  useEffect(() => {
    if (initialValues?.status && initialValues.status !== 'locked') {
      setPreviousStatus(initialValues.status);
    }
  }, [initialValues?.status]);

  // Handle lock/unlock toggle
  const handleLockChange = (checked: boolean) => {
    setIsLocked(checked);
    
    if (checked) {
      if (form.getValues('status') !== 'locked') {
        setPreviousStatus(form.getValues('status'));
      }
      form.setValue('status', 'locked');
    } else {
      form.setValue('status', previousStatus);
    }
  };

  // Add these state variables in the EventForm component
  const [showPastEventWarning, setShowPastEventWarning] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<FormValues | null>(null);

  // Submit handler
  const handleSubmit = async (values: FormValues) => {
    try {
      // Check if the selected date is in the past (only for create mode)
      if (mode === 'create') {
        const selectedDate = new Date(values.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          // Show warning dialog for past events
          setPendingSubmission(values);
          setShowPastEventWarning(true);
          return;
        }
      }
      
      // Continue with normal submission
      await submitEvent(values);
    } catch (error) {
      console.error('Error submitting event form:', error);
    }
  };

  // Add helper function for actual submission
  const submitEvent = async (values: FormValues) => {
    // If a product is selected in the form
    if (values.product_id) {
      const productDetails = await fetchProductById(values.product_id);
      
      if (productDetails) {
        // Use the ProductInfo type without delivery_mode
        values.ProductInfo = {
          id: productDetails.id,
          name: productDetails.name,
          icon_name: productDetails.icon_name,
          gradient: productDetails.gradient,
          description_de: productDetails.description_de,
          description_effort: productDetails.description_effort,
        };
      }
    }
    
    await onSubmit(values);
  };

  // Fetch product details when product_id changes
  useEffect(() => {
    const fetchSelectedProduct = async () => {
      const productId = form.getValues('product_id');
      if (productId) {
        try {
          const product = await fetchProductById(productId);
          setSelectedProduct(product);
          
          // Now fetch mentor names for the approved mentors
          if (product?.approved && product.approved.length > 0) {
            // Fetch mentor names from user_profile table
            const { data, error } = await supabase
              .from('user_profile')
              .select('user_id, Username')
              .in('user_id', product.approved);
              
            if (!error && data) {
              const mentorNames = data.map(mentor => ({
                id: mentor.user_id,
                name: mentor.Username || 'Unknown'
              }));
              setApprovedMentorNames(mentorNames);
              
              // AUTO-SELECT ALL APPROVED MENTORS BY DEFAULT
              // Only do this if no mentors are currently selected (to avoid overriding user selections)
              const currentSelectedMentors = form.getValues('initial_selected_mentors') || [];
              if (currentSelectedMentors.length === 0) {
                const allApprovedIds = mentorNames.map(mentor => mentor.id);
                form.setValue('initial_selected_mentors', allApprovedIds);
              }
            } else {
              console.error('Error fetching approved mentors:', error);
              setApprovedMentorNames([]);
            }
          } else {
            setApprovedMentorNames([]);
            // Clear selection if no approved mentors
            form.setValue('initial_selected_mentors', []);
          }

          // Only auto-set required mentors if creating a new event or if the value is not set
          if (
            product?.min_amount_mentors != null &&
            (mode === 'create' || !form.getValues('amount_requiredmentors'))
          ) {
            form.setValue('amount_requiredmentors', product.min_amount_mentors);
          }
        } catch (error) {
          console.error('Error fetching product details:', error);
        }
      } else {
        setSelectedProduct(null);
        setApprovedMentorNames([]);
        // Clear selection when no product is selected
        form.setValue('initial_selected_mentors', []);
      }
    };
    
    fetchSelectedProduct();
  }, [form.watch('product_id')]);

  // Add this effect to fetch all traits
  useEffect(() => {
    const fetchGroupNames = async () => {
      try {
        const { data, error } = await supabase
          .from('mentor_groups')
          .select('id, group_name');
          
        if (error) {
          console.error('Error fetching traits:', error);
          return;
        }
        
        // Create mapping of ID to group name
        const groupMap = data.reduce((acc, group) => {
          acc[group.id] = group.group_name;
          return acc;
        }, {} as Record<string, string>);
        
        setGroupNames(groupMap);
      } catch (err) {
        console.error('Error in fetchGroupNames:', err);
      }
    };
    
    fetchGroupNames();
  }, []);

  // Watch time and duration to calculate end time
  const watchedTime = form.watch('time');
  const watchedDuration = form.watch('duration_minutes');
  
  // Calculate and display end time
  const endTime = React.useMemo(() => {
    if (watchedTime && watchedDuration) {
      return calculateEndTime(watchedTime, watchedDuration);
    }
    return '';
  }, [watchedTime, watchedDuration]);

  // Form UI remains mostly the same...

  // Footer changes to clean up dev buttons
  return (
    <Card className="w-full bg-background/80 shadow-xl border-none rounded-2xl p-0">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-2xl font-bold">
          {mode === 'create'
            ? language === 'en' ? 'Create New Event' : 'Neue Veranstaltung erstellen'
            : language === 'en' ? 'Edit Event' : 'Veranstaltung bearbeiten'
          }
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-10">
            {/* Product Section */}
            <div>
              <ProductSection
                form={form}
                selectedProduct={selectedProduct}
                groupNames={groupNames}
                isLoading={isLoading}
                language={language}
              />
            </div>
            {/* Staff Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-6 w-6 text-primary" />
                <span className="font-semibold text-xl">{language === "en" ? "Staff" : "Mitarbeiter"}</span>
              </div>
              <StaffSection
                form={form}
                isLoading={isLoading}
                language={language}
              />
            </div>
            {/* Company Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="font-semibold text-xl">{language === "en" ? "Company" : "Unternehmen"}</span>
              </div>
              <CompanySection
                form={form}
                isLoading={isLoading}
                language={language}
              />
            </div>
            {/* Date & Time Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="h-6 w-6 text-primary" />
                <span className="font-semibold text-xl">{language === "en" ? "Date & Time" : "Datum & Zeit"}</span>
              </div>
              <DateTimeSection
                form={form}
                endTime={endTime}
                language={language}
              />
            </div>
            {/* Mentors Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-6 w-6 text-primary" />
                <span className="font-semibold text-xl">{language === "en" ? "Mentors" : "MentorInnen"}</span>
              </div>
              {/* Mentor counter directly under the title */}
              <LockAndMentorCountSection
                form={form}
                selectedProduct={selectedProduct}
                language={language}
                isLoading={isLoading}
              />
              <ProductApprovedMentorSelectSection
                form={form}
                selectedProduct={selectedProduct}
                approvedMentorNames={approvedMentorNames}
                isLoading={isLoading}
                language={language}
              />
            </div>
            {/* Additional Info Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-6 w-6 text-primary" />
                <span className="font-semibold text-xl">{language === "en" ? "Special Info" : "Spezielle Infos"}</span>
              </div>
              <AdditionalInfoAndLinkSection
                form={form}
                showTeamsLink={showTeamsLink}
                language={language}
              />
            </div>
            <FooterSection
              isLoading={isLoading}
              mode={mode}
              language={language}
            />
          </form>
        </Form>
      </CardContent>
      <PastEventWarningDialog
        open={showPastEventWarning}
        onOpenChange={setShowPastEventWarning}
        selectedDate={pendingSubmission?.date || ''}
        onContinueCreate={async () => {
          if (pendingSubmission) {
            setShowPastEventWarning(false);
            await submitEvent(pendingSubmission);
            setPendingSubmission(null);
          }
        }}
      />
    </Card>
  );
};