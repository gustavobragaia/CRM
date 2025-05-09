"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconPlus } from "@tabler/icons-react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { ExamForm } from "@/components/exam-form";

type Patient = {
  id: string;
  name: string;
  clinic_name: string;
};

export interface AddExamDialogProps {
  onExamCreated?: () => void;
}

export function AddExamDialog({ onExamCreated }: AddExamDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"initial" | "existing-patient" | "create-exam">("initial");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userClinicId, setUserClinicId] = useState<string | null>(null);

  // Get current user and role on component mount
  useEffect(() => {
    async function getUserData() {
      try {
        // Get current authenticated user
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authData.user) {
          console.error("Error fetching user data:", authError);
          return;
        }
        
        // Get user details including role
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("email", authData.user.email)
          .single();
        
        if (userError) {
          console.error("Error fetching user details:", userError);
          return;
        }
        
        setUserRole(userData.user_type);
        setUserClinicId(userData.clinic_id);
      } catch (err) {
        console.error("Unexpected error getting user data:", err);
      }
    }
    
    getUserData();
  }, []);

  // Function to load initial patients (first 10)
  const loadInitialPatients = async () => {
    setIsLoading(true);
    try {
      let patientsQuery = supabase
        .from("patients")
        .select("id, name, clinics(name)")
        .limit(10);
      
      // If user is a clinic, only show patients from their clinic
      if (userRole === "clinic" && userClinicId) {
        patientsQuery = patientsQuery.eq("clinic_id", userClinicId);
      }
      
      const { data: patientsData, error } = await patientsQuery;
      
      if (error) throw error;
      
      // Transform the data to include clinic name
      const formattedPatients = patientsData.map((patient: any) => ({
        id: patient.id,
        name: patient.name,
        clinic_name: patient.clinics?.name || "Clínica não especificada"
      }));
      
      setPatients(formattedPatients);
    } catch (error) {
      console.error("Error loading initial patients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to search for patients as user types
  const searchPatients = async (query: string) => {
    if (query.length < 2) return;
    
    setIsLoading(true);
    try {
      let patientsQuery = supabase
        .from("patients")
        .select("id, name, clinics(name)")
        .ilike("name", `%${query}%`)
        .limit(10);
      
      // If user is a clinic, only show patients from their clinic
      if (userRole === "clinic" && userClinicId) {
        patientsQuery = patientsQuery.eq("clinic_id", userClinicId);
      }
      
      const { data: patientsData, error } = await patientsQuery;
      
      if (error) throw error;
      
      // Transform the data to include clinic name
      const formattedPatients = patientsData.map((patient: any) => ({
        id: patient.id,
        name: patient.name,
        clinic_name: patient.clinics?.name || "Clínica não especificada"
      }));
      
      setPatients(formattedPatients);
    } catch (error) {
      console.error("Error searching patients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial patients or search as query changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchPatients(searchQuery);
    }
  }, [searchQuery]);
  
  // Load initial patients when step changes to existing-patient
  useEffect(() => {
    if (step === "existing-patient") {
      loadInitialPatients();
    }
  }, [step, userRole, userClinicId]);
  
  // Load initial patients when combobox is opened
  useEffect(() => {
    if (comboboxOpen && patients.length === 0) {
      loadInitialPatients();
    }
  }, [comboboxOpen]);

  // Handle patient selection
  const handlePatientSelect = (patientId: string) => {
    setSelectedPatient(patientId);
    setComboboxOpen(false);
    // We'll let the user confirm their selection before redirecting
  };
  
  // Handle confirmation and show exam create dialog
  const handleConfirmPatient = () => {
    if (selectedPatient) {
      setStep("create-exam");
    }
  };

  // Handle creating a new patient
  const handleCreateNewPatient = () => {
    router.push("/dashboard/add-patient");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
          <IconPlus className="mr-1 h-4 w-4" />
          Adicionar exame
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Adicionar Exame</DialogTitle>
        </DialogHeader>
        
        {step === "initial" && (
          <div className="flex flex-col gap-4 py-4">
            <p className="text-center">Adicionar exame a</p>
            <div className="flex justify-center gap-4">
              <Button 
                onClick={() => {
                  setStep("existing-patient");
                  // Will trigger the useEffect to load initial patients
                }}
              >
                Paciente existente
              </Button>
              <Button onClick={handleCreateNewPatient}>
                Criar novo paciente
              </Button>
            </div>
          </div>
        )}
        
        {step === "existing-patient" && (
          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="patient">Digite o nome do paciente</Label>
              <div className="border rounded-md">
                <div className="flex items-center justify-between p-2 border-b">
                  <span className="text-sm">
                    {selectedPatient
                      ? patients.find((patient) => patient.id === selectedPatient)
                        ? `${patients.find((patient) => patient.id === selectedPatient)?.name} - ${patients.find((patient) => patient.id === selectedPatient)?.clinic_name}`
                        : "Selecione um paciente..."
                      : "Selecione um paciente..."}
                  </span>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                </div>
                <div className="p-2">
                  <Input 
                    placeholder="Digite o nome do paciente..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {patients.length === 0 ? (
                    <div className="py-6 text-center text-sm">
                      {isLoading ? "Carregando..." : "Nenhum paciente encontrado."}
                    </div>
                  ) : (
                    <div className="py-1">
                      {patients.map((patient) => (
                        <div
                          key={patient.id}
                          className={`flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground ${selectedPatient === patient.id ? "bg-accent text-accent-foreground" : ""}`}
                          onClick={() => handlePatientSelect(patient.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedPatient === patient.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span>{`${patient.name} - ${patient.clinic_name}`}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("initial")}>
                Voltar
              </Button>
              {selectedPatient && (
                <Button onClick={handleConfirmPatient}>
                  Continuar
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
        
        {step === "create-exam" && selectedPatient && (
          <div className="py-4">
            <DialogHeader className="mb-4">
              <DialogTitle>
                Adicionar exame para {patients.find((patient) => patient.id === selectedPatient)?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto">
              <ExamForm 
                patientId={selectedPatient} 
                onSuccess={() => {
                  // Close the dialog and reset the state
                  setOpen(false);
                  setStep("initial");
                  
                  // Trigger the refresh in the parent component
                  if (onExamCreated) {
                    onExamCreated();
                  }
                }}
                onCancel={() => setStep("existing-patient")}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
