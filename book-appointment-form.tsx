import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListDoctors,
  useCreateAppointment,
  getListAppointmentsQueryKey,
  getGetAppointmentSummaryQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  patientName: z.string().min(2, "Patient name is required"),
  doctorId: z.string().min(1, "Doctor is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
});

export function BookAppointmentForm() {
  const { data: doctors } = useListDoctors();
  const createAppointment = useCreateAppointment();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [conflictError, setConflictError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: "",
      doctorId: "",
      date: "",
      time: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setConflictError(null);
    
    // Combine date and time into ISO string
    // Simplified assumption: local time to ISO
    const dateTime = new Date(`${values.date}T${values.time}:00`);
    
    createAppointment.mutate(
      {
        data: {
          patientName: values.patientName,
          doctorId: Number(values.doctorId),
          startTime: dateTime.toISOString(),
        },
      },
      {
        onSuccess: () => {
          form.reset();
          queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAppointmentSummaryQueryKey() });
          
          toast({
            title: "Appointment booked",
            description: "The appointment has been successfully scheduled.",
            className: "bg-success text-success-foreground border-success-foreground/20",
          });
        },
        onError: (error) => {
          if (error.status === 409) {
            setConflictError("Conflict: Doctor is already booked at that time.");
          } else {
            toast({
              title: "Error",
              description: error.data?.error || "Failed to book appointment",
              variant: "destructive",
            });
          }
        },
      }
    );
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <CalendarIcon className="w-5 h-5 text-primary" />
          Quick Book
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Schedule a new patient visit</p>
      </div>

      {conflictError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Scheduling Conflict</AlertTitle>
          <AlertDescription>{conflictError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="patientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patient Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} data-testid="input-patient-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="doctorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Doctor</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-doctor">
                      <SelectValue placeholder="Select a doctor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {doctors?.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id.toString()}>
                        Dr. {doc.name} ({doc.specialization})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} data-testid="input-date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} data-testid="input-time" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full mt-2" 
            disabled={createAppointment.isPending}
            data-testid="button-submit-appointment"
          >
            {createAppointment.isPending ? "Booking..." : "Book Appointment"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
