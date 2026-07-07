import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { useListDoctors, useCreateDoctor, getListDoctorsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Stethoscope, Plus, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const doctorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  specialization: z.string().min(2, "Specialization must be at least 2 characters"),
});

function AddDoctorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createDoctor = useCreateDoctor();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof doctorSchema>>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: "",
      specialization: "",
    },
  });

  const onSubmit = (values: z.infer<typeof doctorSchema>) => {
    createDoctor.mutate(
      { data: values },
      {
        onSuccess: () => {
          form.reset();
          queryClient.invalidateQueries({ queryKey: getListDoctorsQueryKey() });
          onOpenChange(false);
          toast({
            title: "Doctor added",
            description: `Dr. ${values.name} has been added to the directory.`,
            className: "bg-success text-success-foreground border-success-foreground/20",
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.data?.error || "Failed to add doctor",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Doctor</DialogTitle>
          <DialogDescription>
            Register a new physician in the MediSync system.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-muted-foreground sm:text-sm">Dr.</span>
                      </div>
                      <Input placeholder="Jane Doe" className="pl-9" {...field} data-testid="input-doctor-name" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="specialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialization</FormLabel>
                  <FormControl>
                    <Input placeholder="Cardiology" {...field} data-testid="input-doctor-specialization" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createDoctor.isPending}
                data-testid="button-submit-doctor"
              >
                {createDoctor.isPending ? "Saving..." : "Add Doctor"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Doctors() {
  const { data: doctors, isLoading } = useListDoctors();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Physician Directory</h1>
            <p className="text-muted-foreground mt-1">Manage your medical staff.</p>
          </div>
          
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-doctor">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Doctor
          </Button>
        </div>

        <AddDoctorDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-6 h-32 animate-pulse">
                <div className="h-5 bg-muted w-1/2 rounded mb-3" />
                <div className="h-4 bg-muted w-1/3 rounded" />
              </div>
            ))}
          </div>
        ) : !doctors || doctors.length === 0 ? (
          <div className="bg-card rounded-xl border border-border border-dashed p-16 text-center text-muted-foreground flex flex-col items-center">
            <Stethoscope className="w-12 h-12 text-muted mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No doctors found</h3>
            <p>Add doctors to the directory to start scheduling appointments.</p>
            <Button variant="outline" className="mt-6" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Doctor
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <div 
                key={doctor.id} 
                className="bg-card rounded-xl border border-border p-6 flex flex-col hover:shadow-md transition-shadow"
                data-testid={`doctor-card-${doctor.id}`}
              >
                <div className="flex items-start gap-4">
                  <div className="bg-secondary p-3 rounded-full text-secondary-foreground shrink-0">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground line-clamp-1">
                      Dr. {doctor.name}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mt-2">
                      {doctor.specialization}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
