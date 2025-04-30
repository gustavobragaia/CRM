"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ClinicForm, type ClinicFormValues } from "@/components/clinic-form";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getSupabaseClient } from "@/lib/supabase-client";

export default function AddClinicPage() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Handle form submission
  async function onSubmit(values: ClinicFormValues) {
    // Only allow admin users to submit the form
    // Note: In a real app, you'd check this on the server side too
    if (!user || user.role !== "admin") {
      toast.error("You don't have permission to add a clinic");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseClient();

      // 1. Create a new user with the clinic role
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.name,
            user_type: "clinic",
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Create a record in the users table
        const { error: userError } = await supabase.from("users").insert({
          id: authData.user.id,
          name: values.name,
          email: values.email,
          password: "", // The actual password is managed by Supabase Auth
          user_type: "clinic",
        });

        if (userError) throw userError;

        // 3. Create the clinic record in the clinics table
        const { data: clinicData, error: clinicError } = await supabase
          .from("clinics")
          .insert({
            user_id: authData.user.id,
            name: values.name,
            address: values.address || null,
            phone: values.phone || null,
            email: values.email,
          })
          .select("id")
          .single();

        if (clinicError) throw clinicError;

        // 4. Update the user record with the clinic_id
        if (clinicData) {
          const { error: userUpdateError } = await supabase
            .from("users")
            .update({ clinic_id: clinicData.id })
            .eq("id", authData.user.id);

          if (userUpdateError) throw userUpdateError;
        }

        // 5. Send password reset email to the clinic user
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          values.email,
          { redirectTo: `${window.location.origin}/reset-password` }
        );

        if (resetError) {
          console.error("Error sending password reset email:", resetError);
          // Continue anyway since the user was created successfully
        }

        toast.success(
          "Clinic added successfully! A password reset link has been sent to their email."
        );
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Error adding clinic:", error);
      toast.error(error.message || "Failed to add clinic");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show loading state or redirect if not admin
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

  // Redirect if not admin (in a real app, you'd handle this server-side)
  if (user && user.role !== "admin") {
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
                  Add New Clinic
                </h1>
                <p className="text-muted-foreground">
                  Create a new clinic user account
                </p>
              </div>

              <div className="px-4 lg:px-6">
                <ClinicForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
