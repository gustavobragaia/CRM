"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase-client";

// Type definition for user data
export interface UserData {
  name: string;
  email: string;
  avatar: string;
  role?: 'admin' | 'clinic'; // User role for access control
  id?: string; // User ID from Supabase
  clinic_id?: string; // Clinic ID for clinic users
}

/**
 * Hook to get the current authenticated user's information
 * @returns Object containing user data, loading state, and any error
 */
export function useCurrentUser() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          console.error("Error fetching user:", error.message);
          setError(error.message);
          return;
        }

        if (data.user) {
          // Get user profile data or use defaults
          const userData: UserData = {
            id: data.user.id,
            name:
              data.user.user_metadata?.full_name ||
              data.user.email?.split("@")[0] ||
              "User",
            email: data.user.email || "",
            avatar: data.user.user_metadata?.avatar_url || "",
            role: data.user.user_metadata?.user_type || undefined,
          };
          
          // If user is a clinic user, fetch their clinic_id from the users table
          if (userData.role === 'clinic') {
            try {
              const { data: userRecord, error: userError } = await supabase
                .from('users')
                .select('clinic_id')
                .eq('id', data.user.id)
                .single();
              
              if (userRecord && !userError) {
                userData.clinic_id = userRecord.clinic_id;
              }
            } catch (err) {
              console.error("Error fetching clinic_id:", err);
            }
          }
          
          setUser(userData);
        } else {
          // Handle case where no user is logged in
          router.push("/login");
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("Failed to fetch user data");
      } finally {
        setLoading(false);
      }
    }

    fetchCurrentUser();
  }, [router]);

  return { user, loading, error };
}
