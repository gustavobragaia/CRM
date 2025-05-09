"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PatientForm, type PatientFormValues } from "@/components/patient-form";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getSupabaseClient } from "@/lib/supabase-client";

export default function AddPatientPage() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [clinics, setClinics] = React.useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loadingClinics, setLoadingClinics] = React.useState(false);

  // Buscar clínicas quando o componente é montado se o usuário for administrador
  React.useEffect(() => {
    async function fetchClinics() {
      if (user && user.role === "admin") {
        setLoadingClinics(true);
        try {
          const supabase = getSupabaseClient();
          const { data, error } = await supabase
            .from("clinics")
            .select("id, name")
            .eq("active", true);

          if (error) throw error;
          setClinics(data || []);
        } catch (error: any) {
          console.error("Erro ao buscar clínicas:", error);
          toast.error("Falha ao carregar clínicas");
        } finally {
          setLoadingClinics(false);
        }
      }
    }

    if (!loading) {
      fetchClinics();
    }
  }, [user, loading]);

  // Lidar com o envio do formulário
  async function onSubmit(values: PatientFormValues) {
    // Apenas permitir usuários administradores ou de clínica para enviar o formulário
    if (!user || (user.role !== "admin" && user.role !== "clinic")) {
      toast.error("Você não tem permissão para adicionar um paciente");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseClient();

      // Determinar o clinic_id com base na função do usuário
      let clinic_id;
      if (user.role === "admin") {
        // Se o administrador estiver adicionando um paciente, ele precisa selecionar uma clínica
        if (!values.clinic_id) {
          toast.error("Por favor, selecione uma clínica para este paciente");
          setIsSubmitting(false);
          return;
        }
        clinic_id = values.clinic_id;
      } else {
        // Se o usuário da clínica estiver adicionando um paciente, use o clinic_id dele
        clinic_id = user.clinic_id;
      }

      // Criar o registro do paciente
      const { data, error } = await supabase
        .from("patients")
        .insert({
          clinic_id,
          name: values.name,
          birth_date: values.birth_date
            ? values.birth_date.toISOString().split("T")[0]
            : null,
          gender: values.gender || null,
          email: values.email || null,
          phone: values.phone || null,
          address: values.address || null,
          // Novos campos da estrutura do banco de dados
          rg: values.rg || null,
          cpf: values.cpf || null,
          sector: values.sector || null,
          position: values.position || null,
          active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Paciente adicionado com sucesso!");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Erro ao adicionar paciente:", error);
      toast.error(error.message || "Falha ao adicionar paciente");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Mostrar estado de carregamento
  if (loading) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center">
            <p>Carregando...</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Redirecionar se não for administrador ou usuário de clínica
  if (user && user.role !== "admin" && user.role !== "clinic") {
    router.push("/dashboard");
    return null;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <h1 className="text-2xl font-bold tracking-tight">
                  Adicionar Novo Paciente
                </h1>
                <p className="text-muted-foreground">
                  Criar um novo registro de paciente
                </p>
              </div>

              <div className="px-4 lg:px-6">
                {loadingClinics && user?.role === "admin" ? (
                  <div className="flex items-center justify-center p-6">
                    <p>Carregando clínicas...</p>
                  </div>
                ) : (
                  <PatientForm
                    onSubmit={onSubmit}
                    isSubmitting={isSubmitting}
                    showClinicSelector={user?.role === "admin"}
                    clinics={clinics}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
