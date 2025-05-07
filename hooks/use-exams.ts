import { supabase } from "@/lib/supabase/client";

// Define the Exam type based on the database structure
export type Exam = {
  id: string;
  patient_id: string;
  exam_type: string;
  exam_date: string;
  result: string | null;
  notes: string | null;
  created_at: string;
  appeared_on_exam: boolean | null;
};

// Function to get all exams for a specific patient
export async function getExamsByPatientId(patientId: string): Promise<Exam[]> {
  try {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("patient_id", patientId)
      .order("exam_date", { ascending: false });
    
    if (error) {
      console.error("Error fetching exams:", error);
      return [];
    }
    
    return data as Exam[];
  } catch (error) {
    console.error("Error in getExamsByPatientId:", error);
    return [];
  }
}

// Function to get a specific exam by ID
export async function getExamById(examId: string): Promise<Exam | null> {
  try {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("id", examId)
      .single();
    
    if (error) {
      console.error("Error fetching exam:", error);
      return null;
    }
    
    return data as Exam;
  } catch (error) {
    console.error("Error in getExamById:", error);
    return null;
  }
}
