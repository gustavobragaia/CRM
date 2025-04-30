"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PatientForm, type PatientFormValues } from "@/components/patient-form";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getSupabaseClient } from "@/lib/supabase-client";

export default function AddPatientPage() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [clinics, setClinics] = React.useState<Array<{ id: string; name: string }>>([]);
  const [loadingClinics, setLoadingClinics] = React.useState(false);

  // Fetch clinics when component mounts if user is admin
  React.useEffect(() => {
    async function fetchClinics() {
      if (user && user.role === "admin") {
        setLoadingClinics(true);
        try {
          const supabase = getSupabaseClient();
          const { data, error } = await supabase
            .from("clinics")
            .select("id, name")
            .eq("active", true);

          if (error) throw error;
          setClinics(data || []);
        } catch (error: any) {
          console.error("Error fetching clinics:", error);
          toast.error("Failed to load clinics");
        } finally {
          setLoadingClinics(false);
        }
      }
    }

    if (!loading) {
      fetchClinics();
    }
  }, [user, loading]);

  // Handle form submission
  async function onSubmit(values: PatientFormValues) {
    // Only allow admin or clinic users to submit the form
    if (!user || (user.role !== "admin" && user.role !== "clinic")) {
      toast.error("You don't have permission to add a patient");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseClient();
      
      // Determine the clinic_id based on user role
      let clinic_id;
      if (user.role === "admin") {
        // If admin is adding a patient, they need to select a clinic
        if (!values.clinic_id) {
          toast.error("Please select a clinic for this patient");
          setIsSubmitting(false);
          return;
        }
        clinic_id = values.clinic_id;
      } else {
        // If clinic user is adding a patient, use their clinic_id
        clinic_id = user.clinic_id;
      }

      // Create the patient record
      const { data, error } = await supabase
        .from("patients")
        .insert({
          clinic_id,
          name: values.name,
          birth_date: values.birth_date ? values.birth_date.toISOString().split('T')[0] : null,
          exam_date: values.exam_date ? values.exam_date.toISOString().split('T')[0] : null,
          gender: values.gender || null,
          email: values.email || null,
          phone: values.phone || null,
          address: values.address || null,
          active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Patient added successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error adding patient:", error);
      toast.error(error.message || "Failed to add patient");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show loading state
  if (loading) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center">
            <p>Loading...</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Redirect if not admin or clinic user
  if (user && user.role !== "admin" && user.role !== "clinic") {
    router.push("/dashboard");
    return null;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <h1 className="text-2xl font-bold tracking-tight">
                  Add New Patient
                </h1>
                <p className="text-muted-foreground">
                  Create a new patient record
                </p>
              </div>

              <div className="px-4 lg:px-6">
                {loadingClinics && user?.role === "admin" ? (
                  <div className="flex items-center justify-center p-6">
                    <p>Loading clinics...</p>
                  </div>
                ) : (
                  <PatientForm 
                    onSubmit={onSubmit} 
                    isSubmitting={isSubmitting} 
                    showClinicSelector={user?.role === "admin"}
                    clinics={clinics}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
