"use client";

import { useEffect, useState } from "react";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getSupabaseClient } from "@/lib/supabase-client";

export function SectionCards() {
  const { user, loading } = useCurrentUser();
  const [clinicCount, setClinicCount] = useState<number | null>(null);
  const [patientCount, setPatientCount] = useState<number | null>(null);
  const [clinicPatientCount, setClinicPatientCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const supabase = getSupabaseClient();
        
        // Get user metadata to access clinic_id
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error fetching user data:', userError);
          setError(userError.message);
          setIsLoading(false);
          return;
        }
        
        const userMetadata = userData.user?.user_metadata;
        const userClinicId = userMetadata?.clinic_id;
        
        if (user?.role === 'admin') {
          // Get count of clinics from the clinics table (admin only)
          const clinicsResponse = await supabase
            .from('clinics')
            .select('*', { count: 'exact', head: true });
          
          if (clinicsResponse.error) {
            console.error('Error fetching clinics:', clinicsResponse.error);
            setError(clinicsResponse.error.message);
          } else {
            setClinicCount(clinicsResponse.count);
          }
          
          // Get count of all patients (admin only)
          const patientsResponse = await supabase
            .from('patients')
            .select('*', { count: 'exact', head: true });
            
          if (patientsResponse.error) {
            console.error('Error fetching patients:', patientsResponse.error);
          } else {
            setPatientCount(patientsResponse.count);
          }
          
          // For admin, also calculate average patients per clinic
          if (clinicsResponse.count && clinicsResponse.count > 0 && patientsResponse.count) {
            const avgPatientsPerClinic = Math.round(patientsResponse.count / clinicsResponse.count);
            setClinicPatientCount(avgPatientsPerClinic);
          }
        }
        
        // For clinic users, get count of patients for their clinic
        if (user?.role === 'clinic' && userClinicId) {
          const clinicPatientsResponse = await supabase
            .from('patients')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', userClinicId);
            
          if (clinicPatientsResponse.error) {
            console.error('Error fetching clinic patients:', clinicPatientsResponse.error);
          } else {
            setClinicPatientCount(clinicPatientsResponse.count);
          }
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Failed to fetch dashboard data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [user]);
  
  if (loading || isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6">
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* ADMIN CARD - Quantity of ALL Patients - Only visible to admin users */}
      {user?.role === 'admin' && (
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Patients (All Clinics)</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {patientCount !== null ? patientCount : 'Loading...'}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <IconTrendingUp />
                +8.3%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              <IconTrendingUp className="size-4" />
              Active patients across all clinics
            </div>
          </CardFooter>
        </Card>
      )}
      
      {/* CLINIC CARD - Quantity of Patients of the current clinic - Visible to both admin and clinic users */}
      {(user?.role === 'admin' || user?.role === 'clinic') && (
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>{user?.role === 'admin' ? 'Average Patients Per Clinic' : 'Your Clinic Patients'}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {clinicPatientCount !== null ? clinicPatientCount : 'Loading...'}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <IconTrendingUp />
                +5.2%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              <IconTrendingUp className="size-4" />
              {user?.role === 'admin' 
                ? 'Average number of patients per clinic' 
                : 'Patients registered at your clinic'}
            </div>
          </CardFooter>
        </Card>
      )}
      
      {/* ADMIN CARD - Quantity of Clinics - Only visible to admin users */}
      {user?.role === 'admin' && (
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Clinics</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {error ? 'Error' : clinicCount !== null ? clinicCount : 'Loading...'}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className={error ? 'bg-red-50' : ''}>
                {error ? (
                  <IconTrendingDown className="text-red-500" />
                ) : (
                  <IconTrendingUp />
                )}
                {error ? 'Error' : '+10%'}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {error ? (
                <span className="text-red-500">Failed to load clinic data</span>
              ) : (
                <>
                  <IconTrendingUp className="size-4" />
                  Active clinics
                </>
              )}
            </div>
            {!error && (
              <div className="text-muted-foreground">
                Registered in the system
              </div>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
