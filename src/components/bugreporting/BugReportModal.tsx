import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { Bug, X } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { fileUploadClient } from "../../lib/fileUploadClient";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Schema for form validation
const bugReportSchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z.string().optional(),
  device: z.string().min(1, "Device information is required"),
  browser: z.string().min(1, "Browser information is required"),
  description: z.string().min(1, "Please describe what happened"),
  expected: z.string().optional(),
  screenshot: z.instanceof(FileList).optional().transform(val => val && val.length > 0 ? val[0] : null),
});

type BugReportFormValues = z.infer<typeof bugReportSchema>;

// Add onClose prop to the interface
interface BugReportModalProps {
  onClose?: () => void;
}

export function BugReportModal({ onClose }: BugReportModalProps) {
  const { toast } = useToast();
  const { language, theme } = useTheme();
  const { user, session } = useAuth();
  const [open, setOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<BugReportFormValues>({
    resolver: zodResolver(bugReportSchema),
    defaultValues: {
      name: user ? `${user.firstName} ${user.lastName}` : "",
      date: new Date().toISOString().split('T').join(' ').substring(0, 16),
      device: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
      browser: navigator.userAgent,
    },
  });

  // Handle dialog close
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && onClose) {
      onClose();
    }
  };

  async function onSubmit(values: BugReportFormValues) {
    setIsSubmitting(true);
    
    try {
      let screenshotUrl = null;
      
      // Upload screenshot if provided
      if (values.screenshot) {
        try {
          if (!session) {
            console.warn("No active session found, upload might fail");
          }
          
          const file = values.screenshot;
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${user?.id?.substring(0, 8) || 'anon'}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
          
          console.log("Uploading file:", file.name, "type:", file.type);
          const { data: uploadData, error: uploadError } = await fileUploadClient.storage
            .from('mbbug-report-screenshots')
            .upload(fileName, file, {
              contentType: file.type
            });
            
          if (uploadError) {
            console.error("Upload error:", uploadError);
            throw new Error(`Screenshot upload failed: ${uploadError.message}`);
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('mbbug-report-screenshots')
            .getPublicUrl(fileName);
            
          screenshotUrl = publicUrl;
          console.log("Screenshot uploaded successfully:", screenshotUrl);
        } catch (uploadError) {
          console.error("Screenshot upload failed:", uploadError);
          toast({
            title: language === "en" ? "Warning" : "Warnung",
            description: language === "en" 
              ? "Screenshot could not be uploaded, but your report will still be submitted."
              : "Screenshot konnte nicht hochgeladen werden, aber dein Bericht wird trotzdem gesendet.",
            variant: "default"
          });
        }
      }
      
      const workerUrl = "https://mbbugs.mweitner.workers.dev";
      
      const payload = {
        name: values.name,
        date: values.date,
        device: values.device,
        browser: values.browser,
        description: values.description,
        expected: values.expected || "Not provided",
        screenshotUrl,
        url: window.location.href,
        userId: user?.id || null,
        userEmail: user?.email || null,
        userRole: user?.role || null
      };
      
      console.log("Submitting bug report with payload:", { 
        ...payload, 
        description: payload.description.substring(0, 20) + "..." 
      });
      
      const response = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`Failed to submit bug report: ${response.status}`);
      }
      
      const result = await response.json();
      
      toast({
        title: language === "en" ? "Bug report submitted" : "Fehlerbericht gesendet",
        description: language === "en" ? "Thank you for your feedback!" : "Vielen Dank für deine Rückmeldung!",
      });
      
      handleOpenChange(false);
      form.reset();
      
    } catch (error) {
      console.error("Error in bug report submission:", error);
      toast({
        title: language === "en" ? "Error" : "Fehler",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 gap-4"
        onInteractOutside={(e) => e.preventDefault()} // Prevent accidental closing
      >
        <DialogHeader className="mb-2">
        <DialogTitle>{language === "en" ? "Report a Bug" : "Bug melden"}
        </DialogTitle>
          <DialogDescription>
            {language === "en" 
              ? "Help us improve by reporting any issues you encounter." 
              : "Hilf uns, die App zu verbessern, indem du Probleme meldest."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === "en" ? "Name" : "Name"} *</FormLabel>
                  <FormControl>
                    <Input placeholder={language === "en" ? "Your name" : "Dein Name"} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "en" ? "Date and time" : "Datum und Zeit"}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="device"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "en" ? "Device" : "Gerät"} *</FormLabel>
                    <FormControl>
                      <Input placeholder={language === "en" ? "Laptop, Mobile, etc." : "Laptop, Handy, usw."} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="browser"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === "en" ? "Browser" : "Browser"} *</FormLabel>
                  <FormControl>
                    <Input placeholder={language === "en" ? "Chrome, Firefox, etc." : "Chrome, Firefox, usw."} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {language === "en" ? "What happened?" : "Was ist passiert?"} *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={language === "en" 
                        ? "Please describe the issue you encountered"
                        : "Bitte beschreibe das aufgetretene Problem"}
                      {...field}
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="expected"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {language === "en" ? "What did you expect to happen?" : "Was hättest du erwartet?"}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={language === "en"
                        ? "What should have happened instead?"
                        : "Was hätte stattdessen passieren sollen?"}
                      {...field}
                      rows={2}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="screenshot"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>{language === "en" ? "Screenshot (optional)" : "Screenshot (optional)"}</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      {...fieldProps}
                      onChange={event => {
                        onChange(event.target.files);
                      }}
                      className="text-sm file:mr-4 file:py-1 file:px-2 file:text-xs"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {language === "en"
                      ? "Please include a screenshot if it helps explain the issue"
                      : "Bitte füge ein Screenshot hinzu, wenn es hilft, das Problem zu erklären"}
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="h-8 text-xs sm:text-sm">
                {language === "en" ? "Cancel" : "Abbrechen"}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="h-8 text-xs sm:text-sm">
                {isSubmitting 
                  ? (language === "en" ? "Submitting..." : "Wird gesendet...")
                  : (language === "en" ? "Submit Report" : "Bericht senden")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}