"use client";

import * as React from "react";
import {
  IconDashboard,
  IconInnerShadowTop,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";


import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useCurrentUser } from "@/hooks/use-current-user";

// Define dados estáticos
const staticData = {
  // Dados padrão do usuário (serão substituídos no componente)
  user: {
    name: "Convidado",
    email: "",
    avatar: "",
  },
  navMain: [
    {
      title: "Painel",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Adicionar Clínica",
      url: "/dashboard/add-clinic",
      icon: IconUsers,
    },
    {
      title: "Pacientes",
      url: "#",

      items: [
        {
          title: "Ver Pacientes",
          url: "/dashboard/patients",
          icon: IconUsers,
        },
        {
          title: "Adicionar Paciente",
          url: "/dashboard/add-patient",
          icon: IconUsers,
        },
      ],
    },
  ],

  navSecondary: [
    {
      title: "Configurações",
      url: "#",
      icon: IconSettings,
    },
  ],

};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Use the hook inside the component function
  const { user } = useCurrentUser();

  // Cria o objeto de dados do usuário com as informações do usuário atual
  const userData = {
    name: user?.name || "Convidado",
    email: user?.email || "",
    avatar: user?.avatar || "",
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Ltda.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={staticData.navMain} />

        <NavSecondary items={staticData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
