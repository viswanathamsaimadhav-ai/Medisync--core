import React, { useMemo } from "react";
import { Layout } from "@/components/layout";
import { useListAppointments, AppointmentWithDoctor } from "@workspace/api-client-react";
import { format, parseISO, isSameDay } from "date-fns";
import { CalendarDays, Clock, User } from "lucide-react";

type GroupedAppointments = {
  date: Date;
  doctors: {
    doctorId: number;
    doctorName: string;
    specialization: string;
    appointments: AppointmentWithDoctor[];
  }[];
};

export default function Schedule() {
  const { data: appointments, isLoading } = useListAppointments();

  const groupedAgenda = useMemo(() => {
    if (!appointments) return [];

    // Sort all appointments by time
    const sorted = [...appointments].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    const agenda: GroupedAppointments[] = [];

    sorted.forEach((apt) => {
      const aptDate = parseISO(apt.startTime);
      
      // Find matching date group
      let dateGroup = agenda.find(g => isSameDay(g.date, aptDate));
      if (!dateGroup) {
        dateGroup = { date: aptDate, doctors: [] };
        agenda.push(dateGroup);
      }

      // Find matching doctor group within date
      let docGroup = dateGroup.doctors.find(d => d.doctorId === apt.doctorId);
      if (!docGroup) {
        docGroup = { 
          doctorId: apt.doctorId, 
          doctorName: apt.doctor.name,
          specialization: apt.doctor.specialization,
          appointments: [] 
        };
        dateGroup.doctors.push(docGroup);
      }

      docGroup.appointments.push(apt);
    });

    return agenda;
  }, [appointments]);

  return (
    <Layout>
      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Master Schedule</h1>
          <p className="text-muted-foreground mt-1">View all appointments grouped by date and physician.</p>
        </div>

        {isLoading ? (
          <div className="space-y-8">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-6 w-48 bg-muted rounded mb-4"></div>
                <div className="bg-card rounded-xl border border-border p-6 h-32"></div>
              </div>
            ))}
          </div>
        ) : groupedAgenda.length === 0 ? (
          <div className="bg-card rounded-xl border border-border border-dashed p-16 text-center text-muted-foreground flex flex-col items-center">
            <CalendarDays className="w-12 h-12 text-muted mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">Schedule is empty</h3>
            <p>There are no upcoming appointments scheduled.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {groupedAgenda.map((dayGroup, idx) => (
              <div key={idx} className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  {format(dayGroup.date, "EEEE, MMMM d, yyyy")}
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {dayGroup.doctors.map((docGroup) => (
                    <div key={docGroup.doctorId} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
                      <div className="bg-muted/50 p-4 border-b border-border">
                        <h3 className="font-semibold text-foreground">Dr. {docGroup.doctorName}</h3>
                        <p className="text-xs text-muted-foreground">{docGroup.specialization}</p>
                      </div>
                      
                      <div className="p-4 flex-1 flex flex-col gap-3">
                        {docGroup.appointments.map((apt) => (
                          <div 
                            key={apt.id} 
                            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:border-primary/30 transition-colors"
                          >
                            <div className="bg-primary/10 text-primary p-2 rounded-md font-mono text-sm shrink-0 font-medium">
                              {format(parseISO(apt.startTime), "HH:mm")}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                {apt.patientName}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
