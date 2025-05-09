"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Patient, createColumns } from "./columns";
import { DataTable } from "./data-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AuthStatus } from "@/components/auth-status";
import { Exam } from "@/hooks/use-exams";

// Função auxiliar para adicionar exames aos pacientes
async function addExamsToPatients(patients: any[]): Promise<Patient[]> {
  // Cria um mapa para armazenar eficientemente exames por patient_id
  const patientExamsMap = new Map<string, Exam[]>();
  
  // Obtém todos os IDs de pacientes
  const patientIds = patients.map((patient) => patient.id);
  
  // Busca todos os exames para estes pacientes em uma única consulta
  if (patientIds.length > 0) {
    const { data: examsData, error: examsError } = await supabase
      .from("exams")
      .select("*")
      .in("patient_id", patientIds)
      .order("exam_date", { ascending: false });
    
    if (!examsError && examsData) {
      // Agrupa exames por patient_id
      examsData.forEach((exam) => {
        const patientId = exam.patient_id;
        if (!patientExamsMap.has(patientId)) {
          patientExamsMap.set(patientId, []);
        }
        patientExamsMap.get(patientId)?.push(exam);
      });
    }
  }
  
  // Adiciona exames a cada paciente e extrai o nome da clínica
  return patients.map((patient) => {
    // Extrai o nome da clínica dos dados unidos de clínicas
    const clinicName = patient.clinics ? patient.clinics.name : "Desconhecido";
    
    return {
      ...patient,
      clinic_name: clinicName, // Adiciona clinic_name como uma propriedade plana
      exams: patientExamsMap.get(patient.id) || [],
      // Se o paciente tem exames, adiciona o exam_type do exame mais recente
      exam_type: patientExamsMap.get(patient.id)?.[0]?.exam_type || "",
    };
  });
}

export function PatientsDataProvider() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Busca o status de autenticação do usuário
  useEffect(() => {
    async function getUser() {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          throw error;
        }

        console.log("Dados do usuário do lado do cliente:", data.user);
        setUser(data.user);

        if (data.user) {
          // Obtém detalhes do usuário incluindo função
          // Primeiro tenta consultar pelo email do usuário autenticado, pois é mais confiável
          let { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("email", data.user.email)
            .single();

          // Se nenhum usuário for encontrado pelo email, tenta com o ID
          if (userError || !userData) {
            console.log("Nenhum usuário encontrado pelo email, tentando com ID");
            const { data: userDataById, error: userErrorById } = await supabase
              .from("users")
              .select("*")
              .eq("id", data.user.id)
              .single();

            userData = userDataById;
            userError = userErrorById;
          }

          if (userError) {
            throw userError;
          }

          console.log("Dados do usuário do banco de dados:", userData);
          setUserData(userData);

          // Busca pacientes com base na função do usuário
          if (userData.user_type === "admin") {
            // Administrador pode ver todos os pacientes
            const { data: patientsData, error: patientsError } = await supabase
              .from("patients")
              .select("*, clinics(name)")
              .eq("active", true)
              .order("name", { ascending: true });

            if (patientsError) {
              throw patientsError;
            }
            
            // Busca exames para todos os pacientes
            const patientsWithExams = await addExamsToPatients(patientsData || []);
            setPatients(patientsWithExams);
          } else if (userData.user_type === "clinic" && userData.clinic_id) {
            // Usuários de clínica só podem ver pacientes de sua clínica
            const { data: patientsData, error: patientsError } = await supabase
              .from("patients")
              .select("*, clinics(name)")
              .eq("clinic_id", userData.clinic_id)
              .eq("active", true)
              .order("name", { ascending: true });

            if (patientsError) {
              throw patientsError;
            }
            
            // Busca exames para pacientes da clínica
            const patientsWithExams = await addExamsToPatients(patientsData || []);
            setPatients(patientsWithExams);
          }
        }
      } catch (err: any) {
        console.error("Erro:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    getUser();
  }, []);

  if (loading) {
    return <div className="py-8 text-center">Carregando dados dos pacientes...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-md border border-red-200">
          <h2 className="text-xl font-bold mb-2 text-red-600">Erro</h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/dashboard">Voltar ao Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <div className="mb-6">
          <AuthStatus />
        </div>
        <p className="text-gray-600 mb-4">
          Por favor, faça login para visualizar os dados dos pacientes.
        </p>
      </div>
    );
  }

  if (
    userData &&
    userData.user_type !== "admin" &&
    userData.user_type !== "clinic"
  ) {
    return (
      <div className="py-8">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-md border border-red-200">
          <h2 className="text-xl font-bold mb-2 text-red-600">
            Acesso Restrito
          </h2>
          <p className="mb-4 text-gray-600">
            Você não tem permissão para visualizar dados de pacientes.
          </p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/dashboard">Voltar ao Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {userData && userData.user_type === "clinic" && (
        <h2 className="text-lg font-medium mb-4">Pacientes da Sua Clínica</h2>
      )}
      <DataTable 
        columns={createColumns(userData?.user_type || "")} 
        data={patients} 
        userRole={userData?.user_type || ""} 
      />
    </div>
  );
}
