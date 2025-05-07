// Define TypeScript types for Supabase tables

export interface User {
  id: string;
  email: string;
  name: string;
  user_type: string;
  created_at: string;
  clinic_id?: string | null;
  phone?: string | null;
}

export interface Patient {
  id: string;
  name: string;
  birth_date: string | null;
  exam_date: string | null;
  gender: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  clinic_id: string;
  created_at: string;
  active: boolean;
  appeared_on_exam: boolean | null;
}

export interface Clinic {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  notes?: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  clinic_id: string;
  created_at: string;
  patient?: Patient;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  record_date: string;
  record_type: string;
  description: string;
  notes?: string | null;
  doctor_id?: string | null;
  created_at: string;
}

// Database schema types for Supabase
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'created_at'> & { created_at?: string };
        Update: Partial<Omit<User, 'id'>>;
      };
      patients: {
        Row: Patient;
        Insert: Omit<Patient, 'created_at' | 'active'> & { created_at?: string; active?: boolean };
        Update: Partial<Omit<Patient, 'id'>>;
      };
      clinics: {
        Row: Clinic;
        Insert: Omit<Clinic, 'created_at'> & { created_at?: string };
        Update: Partial<Omit<Clinic, 'id'>>;
      };
      appointments: {
        Row: Appointment;
        Insert: Omit<Appointment, 'created_at'> & { created_at?: string };
        Update: Partial<Omit<Appointment, 'id'>>;
      };
      medical_records: {
        Row: MedicalRecord;
        Insert: Omit<MedicalRecord, 'created_at'> & { created_at?: string };
        Update: Partial<Omit<MedicalRecord, 'id'>>;
      };
    };
  };
};
