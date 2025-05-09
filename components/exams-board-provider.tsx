"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Exam } from "@/hooks/use-exams";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AddExamDialog, type AddExamDialogProps } from "@/components/add-exam-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Extended Exam type with patient information
export type ExamWithPatient = Exam & {
  patient_name: string;
  patient_id: string;
};

// Group exams by month and filter by year
function groupExamsByMonth(exams: ExamWithPatient[], filterYear: number | null): Record<string, ExamWithPatient[]> {
  const monthsMap: Record<string, ExamWithPatient[]> = {};
  
  // Initialize all months
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  months.forEach(month => {
    monthsMap[month] = [];
  });
  
  // Filter exams by year if a filter is applied
  const filteredExams = filterYear 
    ? exams.filter(exam => new Date(exam.exam_date).getFullYear() === filterYear)
    : exams;
  
  // Group exams by month
  filteredExams.forEach(exam => {
    const examDate = new Date(exam.exam_date);
    const monthIndex = examDate.getMonth();
    const monthName = months[monthIndex];
    
    if (monthsMap[monthName]) {
      monthsMap[monthName].push(exam);
    }
  });
  
  // Sort exams within each month by date (year, month, day)
  Object.keys(monthsMap).forEach(month => {
    monthsMap[month].sort((a, b) => {
      const dateA = new Date(a.exam_date);
      const dateB = new Date(b.exam_date);
      return dateA.getTime() - dateB.getTime();
    });
  });
  
  return monthsMap;
}

export function ExamsBoardProvider() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [exams, setExams] = useState<ExamWithPatient[]>([]);
  const [examsByMonth, setExamsByMonth] = useState<Record<string, ExamWithPatient[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState<number | null>(new Date().getFullYear()); // Default to current year
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Used to trigger a refresh
  
  // Handle navigation to patient page
  const handleExamClick = (patientId: string) => {
    router.push(`/dashboard/patients/${patientId}`);
  };

  // Function to refresh the exams data
  const refreshExams = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Fetch exams data based on user role
  // Data fetch on mount and when refresh is triggered
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Get current authenticated user
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          throw authError;
        }
        
        if (!authData.user) {
          setLoading(false);
          return;
        }
        
        setUser(authData.user);
        
        // Get user details including role
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("email", authData.user.email)
          .single();
        
        if (userError) {
          throw userError;
        }
        
        setUserData(userData);
        
        // Fetch exams based on user role
        let examsData: ExamWithPatient[] = [];
        
        if (userData.user_type === "admin") {
          // Admin can see all exams
          const { data, error } = await supabase
            .from("exams")
            .select("*, patients(id, name)")
            .order("exam_date", { ascending: false });
          
          if (error) {
            throw error;
          }
          
          // Transform data to include patient name
          examsData = data.map((exam: any) => ({
            ...exam,
            patient_name: exam.patients?.name || "Unknown",
            patient_id: exam.patients?.id || "",
          }));
        } else if (userData.user_type === "clinic" && userData.clinic_id) {
          // Clinic users can only see exams from their clinic's patients
          
          // First, get all patients from this clinic
          const { data: patientsData, error: patientsError } = await supabase
            .from("patients")
            .select("id, name")
            .eq("clinic_id", userData.clinic_id);
          
          if (patientsError) {
            throw patientsError;
          }
          
          if (patientsData && patientsData.length > 0) {
            // Get patient IDs
            const patientIds = patientsData.map((patient: any) => patient.id);
            
            // Get exams for these patients
            const { data: examsResult, error: examsError } = await supabase
              .from("exams")
              .select("*")
              .in("patient_id", patientIds)
              .order("exam_date", { ascending: false });
            
            if (examsError) {
              throw examsError;
            }
            
            // Create a map of patient IDs to names for quick lookup
            const patientMap = new Map();
            patientsData.forEach((patient: any) => {
              patientMap.set(patient.id, patient.name);
            });
            
            // Transform data to include patient name
            examsData = examsResult.map((exam: any) => ({
              ...exam,
              patient_name: patientMap.get(exam.patient_id) || "Unknown",
              patient_id: exam.patient_id,
            }));
          }
        }
        
        setExams(examsData);
        
        // Extract available years from exams data
        const years = examsData.map(exam => new Date(exam.exam_date).getFullYear());
        const uniqueYears = [...new Set(years)].sort((a, b) => b - a); // Sort descending (newest first)
        setAvailableYears(uniqueYears);
        
        // Group exams by month and filter by selected year
        const groupedExams = groupExamsByMonth(examsData, filterYear);
        setExamsByMonth(groupedExams);
      } catch (err: any) {
        console.error("Error fetching exams:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes
  
  // Update exams by month when filter year changes
  useEffect(() => {
    if (exams.length > 0) {
      const groupedExams = groupExamsByMonth(exams, filterYear);
      setExamsByMonth(groupedExams);
    }
  }, [exams, filterYear]);
  
  // Format date for display (DD/MMM/YYYY)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('pt-BR', { month: 'short' }).substring(0, 3);
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  // Get status badge based on exam properties
  const getExamStatus = (exam: ExamWithPatient) => {
    const examDate = new Date(exam.exam_date);
    const today = new Date();
    
    if (exam.result) {
      return { label: "Concluído", variant: "success" };
    } else if (examDate < today) {
      return { label: "Pendente", variant: "warning" };
    } else {
      return { label: "Agendado", variant: "outline" };
    }
  };
  
  if (loading) {
    return <div className="py-4 text-center">Carregando exames...</div>;
  }
  
  if (error) {
    return <div className="py-4 text-center text-red-500">Erro: {error}</div>;
  }
  
  if (!user) {
    return <div className="py-4 text-center">Faça login para ver os exames</div>;
  }
  
  return (
    <div className="flex flex-col gap-4">
      {/* Year filter */}
      <div className="flex items-center gap-2">
        <Label htmlFor="year-filter" className="text-sm font-medium">Filtre por ano:</Label>
        <Select
          value={filterYear?.toString() || 'all'}
          onValueChange={(value) => setFilterYear(value === 'all' ? null : parseInt(value))}
        >
          <SelectTrigger id="year-filter" className="w-[180px]">
            <SelectValue placeholder="Selecione um ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os anos</SelectItem>
            {availableYears.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {/* All months in a single row */}
        {[
          // First Semester
          { name: 'Janeiro', semester: 'Primeiro Semestre' },
          { name: 'Fevereiro', semester: 'Primeiro Semestre' },
          { name: 'Março', semester: 'Primeiro Semestre' },
          { name: 'Abril', semester: 'Primeiro Semestre' },
          { name: 'Maio', semester: 'Primeiro Semestre' },
          { name: 'Junho', semester: 'Primeiro Semestre' },
          // Second Semester
          { name: 'Julho', semester: 'Segundo Semestre' },
          { name: 'Agosto', semester: 'Segundo Semestre' },
          { name: 'Setembro', semester: 'Segundo Semestre' },
          { name: 'Outubro', semester: 'Segundo Semestre' },
          { name: 'Novembro', semester: 'Segundo Semestre' },
          { name: 'Dezembro', semester: 'Segundo Semestre' }
        ].map((month) => (
          <div key={month.name} className="flex-shrink-0 w-80">
            <div className="bg-muted rounded-t-lg p-3">
              <div className="text-xs text-muted-foreground">{month.semester}</div>
              <div className="font-medium">{month.name}</div>
            </div>
            <div className="border border-t-0 rounded-b-lg p-2 min-h-80 flex flex-col gap-2">
              {/* Actual exam cards from the database */}
              {examsByMonth[month.name]?.map((exam) => {
                const status = getExamStatus(exam);
                return (
                  <div 
                    key={exam.id} 
                    className="bg-card p-3 rounded-md border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleExamClick(exam.patient_id)}
                  >
                    {/* Patient Name - Bold and prominent */}
                    <div className="font-semibold text-base mb-1 truncate">{exam.patient_name}</div>
                    
                    {/* Exam Type */}
                    <div className="text-sm mb-2">
                      <span className="text-muted-foreground">Tipo do exame:</span> {exam.exam_type}
                    </div>
                    
                    {/* Badges Row */}
                    <div className="flex gap-2 mb-2">
                      <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                        ASO anexado
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-700">
                        O.S anexado
                      </Badge>
                    </div>
                    
                    {/* Appeared Status */}
                    <div className="text-sm mb-2">
                      <span className="text-muted-foreground">Compareceu?</span>{' '}
                      {exam.appeared_on_exam ? (
                        <span className="text-green-600 font-medium">Sim</span>
                      ) : (
                        <span className="text-red-600 font-medium">Não</span>
                      )}
                    </div>
                    
                    {/* Date - Bottom right */}
                    <div className="flex justify-end mt-2">
                      <div className="text-xs font-medium px-2 py-1 bg-muted rounded-md">
                        {formatDate(exam.exam_date)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <AddExamDialog onExamCreated={refreshExams} />
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
