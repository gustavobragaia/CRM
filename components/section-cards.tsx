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
        
        // Get user data including clinic_id
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error fetching user data:', userError);
          setError(userError.message);
          setIsLoading(false);
          return;
        }
        
        // Get the user's clinic_id from the users table
        let userClinicId = null;
        
        if (userData.user) {
          // First check if the user exists in the users table
          const { data: userRecords, error: userRecordError } = await supabase
            .from('users')
            .select('clinic_id')
            .eq('id', userData.user.id);
            
          if (userRecordError) {
            console.error('Error fetching user record:', userRecordError);
          } else if (userRecords && userRecords.length > 0) {
            userClinicId = userRecords[0].clinic_id;
            console.log('Found clinic_id:', userClinicId);
          } else {
            console.log('User record not found in users table. Using metadata clinic_id if available.');
            // Try to get clinic_id from user metadata as fallback
            userClinicId = userData.user.user_metadata?.clinic_id || null;
          }
        }
        
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
        <p>Carregando dados do painel...</p>
      </div>
    );
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* CARD DE ADMIN - Quantidade de TODOS os Pacientes - Visível apenas para usuários admin */}
      {user?.role === 'admin' && (
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total de Pacientes (Todas as Clínicas)</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {patientCount !== null ? patientCount : 'Carregando...'}
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
              Pacientes ativos em todas as clínicas
            </div>
          </CardFooter>
        </Card>
      )}
      
      {/* CARD DE CLÍNICA - Quantidade de Pacientes da clínica atual - Visível para usuários admin e de clínica */}
      {(user?.role === 'admin' || user?.role === 'clinic') && (
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>{user?.role === 'admin' ? 'Média de Pacientes Por Clínica' : 'Pacientes da Sua Clínica'}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {clinicPatientCount !== null ? clinicPatientCount : 'Carregando...'}
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
                ? 'Número médio de pacientes por clínica' 
                : 'Pacientes registrados na sua clínica'}
            </div>
          </CardFooter>
        </Card>
      )}
      
      {/* CARD DE ADMIN - Quantidade de Clínicas - Visível apenas para usuários admin */}
      {user?.role === 'admin' && (
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total de Clínicas</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {error ? 'Erro' : clinicCount !== null ? clinicCount : 'Carregando...'}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className={error ? 'bg-red-50' : ''}>
                {error ? (
                  <IconTrendingDown className="text-red-500" />
                ) : (
                  <IconTrendingUp />
                )}
                {error ? 'Erro' : '+10%'}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {error ? (
                <span className="text-red-500">Falha ao carregar dados da clínica</span>
              ) : (
                <>
                  <IconTrendingUp className="size-4" />
                  Clínicas ativas
                </>
              )}
            </div>
            {!error && (
              <div className="text-muted-foreground">
                Registradas no sistema
              </div>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
