import React from "react";
import { notFound } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getPatientById } from "@/hooks/use-patients";
import { PatientClientForm } from "./patient-client-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

// This is a server component that fetches data and renders the page
export default async function PatientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const patient = await getPatientById(params.id);

  if (!patient) {
    notFound();
  }

  // Convert patient data to a serializable format to pass to the client component
  const patientData = {
    ...patient,
    // Ensure dates are strings for serialization
    birth_date: patient.birth_date,
    exam_date: patient.exam_date,
    created_at: patient.created_at,
  };

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
                <div className="flex items-center gap-2 mb-6">
                  <Button variant="outline" size="sm" asChild className="gap-1">
                    <Link href="/dashboard/patients">
                      <IconArrowLeft className="h-4 w-4" />
                      Back to Patients
                    </Link>
                  </Button>
                </div>

                <h1 className="text-2xl font-bold tracking-tight mb-4">
                  Patient Details
                </h1>

                {/* Pass the patient data to the client component */}
                <PatientClientForm patientData={patientData} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
