"use server"

import { createServerClient } from "@/lib/supabase-server"
import { Patient } from "@/app/dashboard/patients/columns"

/**
 * Fetches all active patients from the database
 * @returns Array of patients
 */
export async function getPatients(): Promise<Patient[]> {
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true })
  
  if (error) {
    console.error("Error fetching patients:", error)
    return []
  }
  
  return data || []
}

/**
 * Fetches a single patient by ID
 * @param id Patient ID
 * @returns Patient object or null if not found
 */
export async function getPatientById(id: string): Promise<Patient | null> {
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error(`Error fetching patient with ID ${id}:`, error)
    return null
  }
  
  return data
}

/**
 * Fetches patients for a specific clinic
 * @param clinicId Clinic ID
 * @returns Array of patients
 */
export async function getPatientsByClinic(clinicId: string): Promise<Patient[]> {
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('active', true)
    .order('name', { ascending: true })
  
  if (error) {
    console.error(`Error fetching patients for clinic ${clinicId}:`, error)
    return []
  }
  
  return data || []
}
