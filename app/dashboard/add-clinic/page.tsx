"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ClinicForm, type ClinicFormValues } from "@/components/clinic-form";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getSupabaseClient } from "@/lib/supabase-client";

export default function AddClinicPage() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Redirecionar se não for administrador usando useEffect
  React.useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Lidar com o envio do formulário
  async function onSubmit(values: ClinicFormValues) {
    // Apenas permitir usuários administradores para enviar o formulário
    // Nota: Em um aplicativo real, você verificaria isso também no lado do servidor
    if (!user || user.role !== "admin") {
      toast.error("Você não tem permissão para adicionar uma clínica");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseClient();

      // 1. Criar um novo usuário sem afetar a sessão atual do admin
      // Usando a API direta do Supabase para não afetar a sessão atual
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          data: {
            full_name: values.name,
            user_type: "clinic",
            role: "clinic",
          },
        }),
      });
      
      const authData = await response.json();
      
      if (!response.ok) {
        throw new Error('Falha ao criar usuário: ' + JSON.stringify(authData));
      }

      if (authData && authData.user) {
        // 2. Criar um registro na tabela de usuários primeiro
        const { error: userError } = await supabase.from("users").insert({
          id: authData.user.id,
          name: values.name,
          email: values.email,
          password: values.password,
          user_type: "clinic",
          // clinic_id será atualizado depois
        });

        if (userError) throw userError;
        
        // 3. Criar um registro na tabela de clínicas
        const { data: clinicData, error: clinicError } = await supabase
          .from("clinics")
          .insert({
            user_id: authData.user.id,
            name: values.name,
            address: values.address || null,
            phone: values.phone || null,
            email: values.email,
            CNPJ: values.CNPJ || null,
            social_reason: values.social_reason || null,
          })
          .select("id")
          .single();

        if (clinicError) throw clinicError;
        
        // 4. Atualizar o registro do usuário com o clinic_id
        if (clinicData) {
          const { error: userUpdateError } = await supabase
            .from("users")
            .update({ clinic_id: clinicData.id })
            .eq("id", authData.user.id);

          if (userUpdateError) throw userUpdateError;
        }
        
        // 5. Atualizar os metadados do usuário na autenticação para incluir clinic_id
        const { error: updateUserError } = await supabase.auth.updateUser({
          data: {
            clinic_id: clinicData?.id,
            role: "clinic",
          }
        });
        
        if (updateUserError) {
          console.error("Erro ao atualizar metadados do usuário:", updateUserError);
          // Continuar mesmo assim, já que o usuário e a clínica foram criados
        }
        
        // 5. Opcional: Enviar email de boas-vindas (não de redefinição de senha)
        // Isso permite que o usuário faça login com a senha definida pelo admin
        // Se quiser enviar um email de boas-vindas, use um serviço de email separado

        toast.success(
          "Clínica adicionada com sucesso! O usuário da clínica pode fazer login imediatamente com as credenciais fornecidas."
        );
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Erro ao adicionar clínica:", error);
      toast.error(error.message || "Falha ao adicionar clínica");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Mostrar estado de carregamento ou redirecionar se não for administrador
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

  // Retornar null enquanto redireciona
  if (user && user.role !== "admin" && !loading) {
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
                  Adicionar Nova Clínica
                </h1>
                <p className="text-muted-foreground">
                  Criar uma nova conta de usuário de clínica
                </p>
              </div>

              <div className="px-4 lg:px-6">
                <ClinicForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
