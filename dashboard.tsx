import React from "react";
import { Layout } from "@/components/layout";
import { BookAppointmentForm } from "@/components/book-appointment-form";
import { AppointmentsList } from "@/components/appointments-list";
import { useGetAppointmentSummary } from "@workspace/api-client-react";
import { Users, CalendarCheck, Clock } from "lucide-react";

export default function Dashboard() {
  const { data: summary, isLoading } = useGetAppointmentSummary();

  return (
    <Layout>
      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1">Manage today's clinical operations.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-lg text-primary">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Appointments</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-total">
                  {isLoading ? "-" : summary?.total || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2.5 rounded-lg text-blue-500">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-upcoming">
                  {isLoading ? "-" : summary?.upcoming || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-success/10 p-2.5 rounded-lg text-success">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Past Completed</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-past">
                  {isLoading ? "-" : summary?.past || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Upcoming Appointments</h2>
            </div>
            <AppointmentsList />
          </div>
          
          <div>
            <div className="sticky top-6">
              <BookAppointmentForm />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
