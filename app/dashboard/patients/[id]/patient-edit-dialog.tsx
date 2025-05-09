"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconEdit } from "@tabler/icons-react";
import { PatientFormComponent } from "./patient-form-component";
import { Patient } from "@/app/dashboard/patients/columns";

interface PatientEditDialogProps {
  patientData: Patient;
}

export function PatientEditDialog({ patientData }: PatientEditDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <IconEdit className="h-4 w-4" />
          Editar Paciente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Informações do Paciente</DialogTitle>
        </DialogHeader>
        <PatientFormComponent patientData={patientData} />
      </DialogContent>
    </Dialog>
  );
}
