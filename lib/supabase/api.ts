import { supabase } from './client';

// Patients
export async function getPatients(
  limit = 20,
  offset = 0,
  searchQuery?: string,
  clinicId?: string,
  sortBy: 'name' | 'exam_date' = 'name',
  sortOrder: 'asc' | 'desc' = 'asc',
  activeOnly = true
) {
  try {
    // Start building the query
    let query = supabase
      .from('patients')
      .select('*', { count: 'exact' });

    // Filter by active status if requested
    if (activeOnly) {
      query = query.eq('active', true);
    }

    // If a clinic ID is provided, filter by it
    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }

    // If a search query is provided, add server-side filtering
    if (searchQuery && searchQuery.trim()) {
      const search = `%${searchQuery.trim()}%`;
      query = query.or(`name.ilike.${search},email.ilike.${search},phone.ilike.${search}`);
    }

    // Apply sorting
    if (sortBy === 'name') {
      query = query.order('name', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'exam_date') {
      query = query.order('exam_date', { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    const { data, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching patients:', error);
      throw new Error(`Failed to fetch patients: ${error.message}`);
    }

    return {
      data: data || [],
      totalCount: count || 0
    };
  } catch (error) {
    console.error('Exception in getPatients:', error);
    throw error;
  }
}

// Get a single patient
export async function getPatient(patientId: string) {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (error) {
      console.error('Error fetching patient:', error);
      throw new Error(`Failed to fetch patient: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Exception in getPatient:', error);
    throw error;
  }
}

// Create a new patient
export async function createPatient(patient: {
  name: string;
  birth_date?: string | null;
  gender?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  clinic_id: string;
  exam_date?: string | null;
  appeared_on_exam?: boolean | null;
}) {
  try {
    const { data, error } = await supabase
      .from('patients')
      .insert({
        ...patient,
        created_at: new Date().toISOString(),
        active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating patient:', error);
      throw new Error(`Failed to create patient: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Exception in createPatient:', error);
    throw error;
  }
}

// Update a patient
export async function updatePatient(
  patientId: string,
  updates: {
    name?: string;
    birth_date?: string | null;
    gender?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    exam_date?: string | null;
    appeared_on_exam?: boolean | null;
  }
) {
  try {
    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', patientId)
      .select()
      .single();

    if (error) {
      console.error('Error updating patient:', error);
      throw new Error(`Failed to update patient: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Exception in updatePatient:', error);
    throw error;
  }
}

// Deactivate a patient (soft delete)
export async function deactivatePatient(patientId: string) {
  try {
    const { data, error } = await supabase
      .from('patients')
      .update({ active: false })
      .eq('id', patientId)
      .select()
      .single();

    if (error) {
      console.error('Error deactivating patient:', error);
      throw new Error(`Failed to deactivate patient: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Exception in deactivatePatient:', error);
    throw error;
  }
}

// Clinics
export async function getClinics() {
  try {
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching clinics:', error);
      throw new Error(`Failed to fetch clinics: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getClinics:', error);
    throw error;
  }
}

// Get a single clinic
export async function getClinic(clinicId: string) {
  try {
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', clinicId)
      .single();

    if (error) {
      console.error('Error fetching clinic:', error);
      throw new Error(`Failed to fetch clinic: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Exception in getClinic:', error);
    throw error;
  }
}

// Create a new clinic
export async function createClinic(clinic: {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('clinics')
      .insert({
        ...clinic,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating clinic:', error);
      throw new Error(`Failed to create clinic: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Exception in createClinic:', error);
    throw error;
  }
}

// Update a clinic
export async function updateClinic(
  clinicId: string,
  updates: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
  }
) {
  try {
    const { data, error } = await supabase
      .from('clinics')
      .update(updates)
      .eq('id', clinicId)
      .select()
      .single();

    if (error) {
      console.error('Error updating clinic:', error);
      throw new Error(`Failed to update clinic: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Exception in updateClinic:', error);
    throw error;
  }
}

// Appointments
export async function getAppointments(
  patientId?: string,
  startDate?: string,
  endDate?: string,
  limit = 20,
  offset = 0
) {
  try {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        patient:patient_id (
          id,
          name,
          phone
        )
      `, { count: 'exact' });

    // Filter by patient if provided
    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    // Filter by date range if provided
    if (startDate) {
      query = query.gte('appointment_date', startDate);
    }
    if (endDate) {
      query = query.lte('appointment_date', endDate);
    }

    // Order by date and time
    query = query.order('appointment_date', { ascending: true });

    // Apply pagination
    const { data, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching appointments:', error);
      throw new Error(`Failed to fetch appointments: ${error.message}`);
    }

    return {
      data: data || [],
      totalCount: count || 0
    };
  } catch (error) {
    console.error('Exception in getAppointments:', error);
    throw error;
  }
}

// Create a new appointment
export async function createAppointment(appointment: {
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  notes?: string;
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  clinic_id: string;
}) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        ...appointment,
        created_at: new Date().toISOString(),
        status: appointment.status || 'scheduled'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating appointment:', error);
      throw new Error(`Failed to create appointment: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Exception in createAppointment:', error);
    throw error;
  }
}

// Update an appointment
export async function updateAppointment(
  appointmentId: string,
  updates: {
    appointment_date?: string;
    appointment_time?: string;
    notes?: string;
    status?: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  }
) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment:', error);
      throw new Error(`Failed to update appointment: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Exception in updateAppointment:', error);
    throw error;
  }
}

// Cancel an appointment
export async function cancelAppointment(appointmentId: string, reason?: string) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled'
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) {
      console.error('Error cancelling appointment:', error);
      throw new Error(`Failed to cancel appointment: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Exception in cancelAppointment:', error);
    throw error;
  }
}

// Medical Records
export async function getMedicalRecords(patientId: string) {
  try {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('record_date', { ascending: false });

    if (error) {
      console.error('Error fetching medical records:', error);
      throw new Error(`Failed to fetch medical records: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getMedicalRecords:', error);
    throw error;
  }
}

// Create a new medical record
export async function createMedicalRecord(record: {
  patient_id: string;
  record_date: string;
  record_type: string;
  description: string;
  notes?: string;
  doctor_id?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('medical_records')
      .insert({
        ...record,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating medical record:', error);
      throw new Error(`Failed to create medical record: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Exception in createMedicalRecord:', error);
    throw error;
  }
}

// Update a medical record
export async function updateMedicalRecord(
  recordId: string,
  updates: {
    record_date?: string;
    record_type?: string;
    description?: string;
    notes?: string;
    doctor_id?: string;
  }
) {
  try {
    const { data, error } = await supabase
      .from('medical_records')
      .update(updates)
      .eq('id', recordId)
      .select()
      .single();

    if (error) {
      console.error('Error updating medical record:', error);
      throw new Error(`Failed to update medical record: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Exception in updateMedicalRecord:', error);
    throw error;
  }
}

// User Management
export async function getUserDetails(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        clinic:clinic_id (
          id,
          name
        )
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user details:', error);
      throw new Error(`Failed to fetch user details: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Exception in getUserDetails:', error);
    throw error;
  }
}

// Update user details
export async function updateUserDetails(
  userId: string,
  updates: {
    name?: string;
    email?: string;
    phone?: string;
    clinic_id?: string;
    user_type?: string;
  }
) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user details:', error);
      throw new Error(`Failed to update user details: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Exception in updateUserDetails:', error);
    throw error;
  }
}

// Get all users for a clinic
export async function getClinicUsers(clinicId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching clinic users:', error);
      throw new Error(`Failed to fetch clinic users: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getClinicUsers:', error);
    throw error;
  }
}
