"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Patient } from "./columns";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AuthStatus } from "@/components/auth-status";

export function PatientsDataProvider() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user authentication status
  useEffect(() => {
    async function getUser() {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          throw error;
        }

        console.log("Client-side user data:", data.user);
        setUser(data.user);

        if (data.user) {
          // Get user details including role
          // First try to query by the auth user's email as it's more reliable
          let { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("email", data.user.email)
            .single();

          // If no user found by email, try with the ID
          if (userError || !userData) {
            console.log("No user found by email, trying with ID");
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

          console.log("User data from database:", userData);
          setUserData(userData);

          // Fetch patients based on user role
          if (userData.user_type === "admin") {
            // Admin can see all patients
            const { data: patientsData, error: patientsError } = await supabase
              .from("patients")
              .select("*")
              .eq("active", true)
              .order("name", { ascending: true });

            if (patientsError) {
              throw patientsError;
            }

            setPatients(patientsData || []);
          } else if (userData.user_type === "clinic" && userData.clinic_id) {
            // Clinic users can only see patients from their clinic
            const { data: patientsData, error: patientsError } = await supabase
              .from("patients")
              .select("*")
              .eq("clinic_id", userData.clinic_id)
              .eq("active", true)
              .order("name", { ascending: true });

            if (patientsError) {
              throw patientsError;
            }

            setPatients(patientsData || []);
          }
        }
      } catch (err: any) {
        console.error("Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    getUser();
  }, []);

  if (loading) {
    return <div className="py-8 text-center">Loading patient data...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-md border border-red-200">
          <h2 className="text-xl font-bold mb-2 text-red-600">Error</h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/dashboard">Return to Dashboard</Link>
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
          Please log in to view patient data.
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
            Access Restricted
          </h2>
          <p className="mb-4 text-gray-600">
            You don't have permission to view patient data.
          </p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {userData && userData.user_type === "clinic" && (
        <h2 className="text-lg font-medium mb-4">Your Clinic's Patients</h2>
      )}
      <DataTable columns={columns} data={patients} />
    </div>
  );
}
