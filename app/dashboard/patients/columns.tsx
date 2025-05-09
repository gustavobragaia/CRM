"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconChevronDown,
  IconChevronRight,
} from "@tabler/icons-react";
import Link from "next/link";
import { Exam } from "@/hooks/use-exams";

// Define o esquema de exame com Zod
export const examSchema = z.object({
  id: z.string().uuid(),
  patient_id: z.string().uuid(),
  exam_type: z.string(),
  exam_date: z.string(),
  result: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  appeared_on_exam: z.boolean().nullable(),
});

// Define o esquema de paciente com Zod
export const patientSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  birth_date: z.string().nullable(),
  exam_date: z.string().nullable(),
  gender: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  clinic_id: z.string().uuid(),
  created_at: z.string(),
  active: z.boolean(),
  appeared_on_exam: z.boolean().nullable(),
  // Novos campos da estrutura do banco de dados
  rg: z.string().nullable().optional(),
  cpf: z.string().nullable().optional(),
  sector: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  // Exames relacionados a este paciente
  exams: z.array(examSchema).optional(),
  // Campos adicionais para exibição
  clinic_name: z.string().optional(),
  exam_type: z.string().optional(),
});

export type Patient = z.infer<typeof patientSchema>;

export const createColumns = (userRole: string): ColumnDef<Patient>[] => [
  {
    id: "expander",
    header: () => null,
    cell: ({ row }) => {
      const exams = row.original.exams || [];
      const hasExams = exams.length > 0;

      return hasExams ? (
        <div className="flex w-[40px] items-center">
          <Button
            variant="ghost"
            onClick={() => row.toggleExpanded()}
            className="p-0 h-8 w-8"
          >
            {row.getIsExpanded() ? (
              <IconChevronDown className="h-4 w-4" />
            ) : (
              <IconChevronRight className="h-4 w-4" />
            )}
          </Button>
          {hasExams && (
            <Badge
              variant="secondary"
              className="ml-2 text-xs whitespace-nowrap"
            >
              {exams.length} exame{exams.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      ) : null;
    },
    enableSorting: false,
    enableHiding: false,
    size: 80, // Define uma largura fixa para a coluna
  },
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todos"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Nome do Paciente",
    cell: ({ row }) => {
      return (
        <Link
          href={`/dashboard/patients/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.name}
        </Link>
      );
    },
  },
  {
    accessorKey: "gender",
    header: "Gênero",
    cell: ({ row }) => (
      <div className="w-24">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.gender || "Não especificado"}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "Date of Birth",
    header: "Data de Nascimento",
    cell: ({ row }) => (
      <div>
        {row.original.birth_date
          ? format(new Date(row.original.birth_date), "PP")
          : "Não especificado"}
      </div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Telefone",
    cell: ({ row }) => <div>{row.original.phone || "Não fornecido"}</div>,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div>{row.original.email || "Não fornecido"}</div>,
  },
  {
    accessorKey: "rg",
    header: "RG",
    cell: ({ row }) => <div>{row.original.rg || "Não fornecido"}</div>,
  },
  {
    accessorKey: "cpf",
    header: "CPF",
    cell: ({ row }) => <div>{row.original.cpf || "Não fornecido"}</div>,
  },
  {
    accessorKey: "sector",
    header: "Setor",
    cell: ({ row }) => <div>{row.original.sector || "Não fornecido"}</div>,
  },
  {
    accessorKey: "position",
    header: "Cargo",
    cell: ({ row }) => <div>{row.original.position || "Não fornecido"}</div>,
  },
  // Mostrar coluna de nome do empregador apenas para usuários administradores
  ...(userRole === "admin"
    ? [
        {
          accessorKey: "Employer name",
          header: "Nome da Clínica",
          cell: ({ row }) => <div>{row.original.clinic_name || "Desconhecido"}</div>,
        } as ColumnDef<Patient>,
      ]
    : []),
  {
    id: "actions",
    cell: ({ row }) => {
      const patient = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <IconDotsVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/patients/${patient.id}`}>
                <IconEdit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              asChild
            >
              <Link href={`/dashboard/patients/${patient.id}/deactivate`}>
                <IconTrash className="mr-2 h-4 w-4" />
                Desativar
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
