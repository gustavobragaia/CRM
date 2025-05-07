import React from "react";
import { notFound } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getPatientById } from "@/hooks/use-patients";
import { getClinicById } from "@/hooks/use-clinics";
import { PatientEditDialog } from "./patient-edit-dialog";
import { ExamCreateDialog } from "./exam-create-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { IconArrowLeft, IconMail } from "@tabler/icons-react";

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

  // Get clinic name
  let clinicName = "Unknown Clinic";
  if (patient.clinic_id) {
    try {
      const clinic = await getClinicById(patient.clinic_id);
      if (clinic) {
        clinicName = clinic.name;
      }
    } catch (error) {
      console.error("Error fetching clinic:", error);
    }
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

                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div className="flex items-start gap-5">
                        {/* Patient Avatar with Initials */}
                        <div className="flex-shrink-0">
                          <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-semibold">
                            {patient.name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                        </div>

                        {/* Patient Information */}
                        <div className="flex-grow space-y-2">
                          <div>
                            <h3 className="text-md font-medium">
                              {patient.name}
                            </h3>
                            <p className="text-sm   text-muted-foreground">
                              {patient.email || "No email provided"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Employer Name:
                            </p>
                            <p className="text-sm">{clinicName}</p>
                          </div>
                        </div>
                      </div>
                      <PatientEditDialog patientData={patientData} />
                    </div>
                  </CardHeader>
                </Card>

                <h1 className="text-2xl font-bold tracking-tight mb-4">
                  Existing Exams
                </h1>

                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Existing Exams</CardTitle>
                      <ExamCreateDialog patientId={patient.id} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* table with existing exams of the patient */}
                    <div className="flex items-start gap-6">
                      {/* Patient Avatar with Initials */}
                      <div className="flex-shrink-0">
                        <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-semibold">
                          {patient.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                      </div>

                      {/* Patient Information */}
                      <div className="flex-grow space-y-2">
                        <div>
                          <h3 className="text-lg font-medium">
                            {patient.name}
                          </h3>
                          <p className="text-muted-foreground">
                            {patient.email || "No email provided"}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Clinic
                          </p>
                          <p>{clinicName}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
