import React from "react";
import { format, parseISO } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAppointments,
  useDeleteAppointment,
  getListAppointmentsQueryKey,
  getGetAppointmentSummaryQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, User, Clock, Stethoscope, UserX } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AppointmentsList() {
  const { data: appointments, isLoading } = useListAppointments();
  const deleteAppointment = useDeleteAppointment();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCancel = (id: number) => {
    deleteAppointment.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAppointmentSummaryQueryKey() });
          toast({
            title: "Appointment cancelled",
            description: "The appointment has been removed from the schedule.",
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.data?.error || "Failed to cancel appointment",
            variant: "destructive",
          });
        }
      }
    );
  };

  const handleNoShow = (id: number, patientName: string) => {
    deleteAppointment.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAppointmentSummaryQueryKey() });
          toast({
            title: "Marked as no-show",
            description: `${patientName} has been recorded as a no-show and the appointment removed.`,
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.data?.error || "Failed to mark as no-show",
            variant: "destructive",
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5 h-24 animate-pulse flex flex-col justify-center">
            <div className="h-4 bg-muted w-1/3 rounded mb-2" />
            <div className="h-3 bg-muted w-1/4 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border border-dashed p-12 text-center text-muted-foreground">
        <CalendarIcon className="w-10 h-10 mx-auto text-muted mb-3" />
        <p className="font-medium text-foreground">No upcoming appointments</p>
        <p className="text-sm mt-1">Schedule a visit to see it here.</p>
      </div>
    );
  }

  // Sort by date/time
  const sortedAppointments = [...appointments].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <div className="space-y-3">
      {sortedAppointments.map((apt) => (
        <div 
          key={apt.id} 
          className="bg-card rounded-xl border border-border p-4 flex items-center justify-between shadow-sm transition-all hover:shadow-md hover:border-primary/20 group"
          data-testid={`appointment-card-${apt.id}`}
        >
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 text-primary p-3 rounded-full flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                {apt.patientName}
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center text-sm text-muted-foreground gap-1 sm:gap-3 mt-1">
                <span className="flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5" />
                  Dr. {apt.doctor.name}
                </span>
                <span className="hidden sm:inline text-border">•</span>
                <span>
                  {format(parseISO(apt.startTime), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Mark as No-Show */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 gap-1.5 text-xs font-medium"
                  data-testid={`button-noshow-apt-${apt.id}`}
                >
                  <UserX className="w-3.5 h-3.5" />
                  No-Show
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Mark as No-Show</AlertDialogTitle>
                  <AlertDialogDescription>
                    Mark <strong>{apt.patientName}</strong> as a no-show for their appointment with Dr. {apt.doctor.name} on {format(parseISO(apt.startTime), "MMM d 'at' h:mm a")}? The record will be deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleNoShow(apt.id, apt.patientName)}
                    className="bg-amber-600 text-white hover:bg-amber-700"
                  >
                    Mark as No-Show
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Cancel */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  data-testid={`button-cancel-apt-${apt.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel the appointment for {apt.patientName} with Dr. {apt.doctor.name}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleCancel(apt.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Cancel Appointment
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
}

// Temporary icon to use in the empty state
function CalendarIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
