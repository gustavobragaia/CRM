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
import { IconDotsVertical, IconEdit, IconTrash } from "@tabler/icons-react";
import Link from "next/link";

// Define the patient schema with Zod
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
  // New fields from database structure
  rg: z.string().nullable().optional(),
  cpf: z.string().nullable().optional(),
  sector: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
});

export type Patient = z.infer<typeof patientSchema>;

export const columns: ColumnDef<Patient>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Patient Name",
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
    header: "Gender",
    cell: ({ row }) => (
      <div className="w-24">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.gender || "Not specified"}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "birth_date",
    header: "Date of Birth",
    cell: ({ row }) => (
      <div>
        {row.original.birth_date
          ? format(new Date(row.original.birth_date), "PP")
          : "Not specified"}
      </div>
    ),
  },
  {
    accessorKey: "exam_date",
    header: "Exam Date",
    cell: ({ row }) => (
      <div>
        {row.original.exam_date
          ? format(new Date(row.original.exam_date), "PP")
          : "Not scheduled"}
      </div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => <div>{row.original.phone || "Not provided"}</div>,
  },
  {
    accessorKey: "Appeared on exam",
    header: "Exam Status",
    cell: ({ row }) => (
      <div className="w-28">
        <Badge
          variant={
            row.original.appeared_on_exam === true
              ? "default"
              : row.original.appeared_on_exam === false
              ? "destructive"
              : "outline"
          }
          className={`px-1.5 ${
            row.original.appeared_on_exam === true
              ? "bg-green-500 hover:bg-green-500/90 text-white"
              : ""
          }`}
        >
          {row.original.appeared_on_exam === true
            ? "Attended"
            : row.original.appeared_on_exam === false
            ? "Missed"
            : "Not recorded"}
        </Badge>
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const patient = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <IconDotsVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/patients/${patient.id}`}>
                <IconEdit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              asChild
            >
              <Link href={`/dashboard/patients/${patient.id}/deactivate`}>
                <IconTrash className="mr-2 h-4 w-4" />
                Deactivate
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
