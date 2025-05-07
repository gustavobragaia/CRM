"use server";

import { createServerClient } from "@/lib/supabase-server";

// Define the clinic type
export interface Clinic {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  created_at?: string;
  active?: boolean;
  user_id?: string | null;
}

/**
 * Get a clinic by its ID
 * @param id The clinic ID
 * @returns The clinic data or null if not found
 */
export async function getClinicById(id: string): Promise<Clinic | null> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("clinics")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching clinic:", error);
      return null;
    }

    return data as Clinic;
  } catch (error) {
    console.error("Unexpected error fetching clinic:", error);
    return null;
  }
}

/**
 * Get all active clinics
 * @returns Array of active clinics
 */
export async function getAllClinics(): Promise<Clinic[]> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("clinics")
      .select("*")
      .eq("active", true)
      .order("name");

    if (error) {
      console.error("Error fetching clinics:", error);
      return [];
    }

    return data as Clinic[];
  } catch (error) {
    console.error("Unexpected error fetching clinics:", error);
    return [];
  }
}
