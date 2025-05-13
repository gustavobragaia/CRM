"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ExpandedState,
  getExpandedRowModel,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import {
  IconCalendar,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconFilter,
  IconLayoutColumns,
  IconPlus,
} from "@tabler/icons-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Import the Patient and Exam types
import { Patient } from "./columns";
import { Exam } from "@/hooks/use-exams";
import supabase from "@/lib/supabase/client";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  userRole?: string;
}

export function DataTable<TData extends object, TValue>({
  columns,
  data,
  userRole = "",
}: DataTableProps<TData, TValue>) {
  // Set default sorting to name ascending
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "name", desc: false },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  // Set default column visibility - only show selected columns initially
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      // Always visible columns
      name: true,
      exams: true,
      actions: true,
      // Hidden by default
      gender: false,
      "Date of Birth": false, // This matches the exact accessor key in columns.tsx
      email: false,
      phone: false,
      address: false,
      // Additional employee fields
      rg: false,
      cpf: true,
      sector: false,
      position: false,
      // Admin-specific columns
      "Employer name": userRole === "admin", // Matches the exact accessor key for clinic column
      created_at: false,
    });
  const [rowSelection, setRowSelection] = React.useState({});
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // State for filters
  const [monthFilter, setMonthFilter] = React.useState<string>("all");
  const [yearFilter, setYearFilter] = React.useState<string>("all");
  const [hasExamFilter, setHasExamFilter] = React.useState<string>("all");
  const [clinicFilter, setClinicFilter] = React.useState<string>("all");
  const [sortOrder, setSortOrder] = React.useState<string>("year-asc");

  // State for clinics list
  const [clinics, setClinics] = React.useState<
    { value: string; label: string }[]
  >([]);

  // Fetch clinics for admin users
  React.useEffect(() => {
    if (userRole === "admin") {
      const fetchClinics = async () => {
        const { data, error } = await supabase
          .from("clinics")
          .select("id, name")
          .order("name", { ascending: true });

        if (!error && data) {
          const clinicOptions = data.map((clinic) => ({
            value: clinic.id,
            label: clinic.name,
          }));
          setClinics(clinicOptions);
        }
      };

      fetchClinics();
    }
  }, [userRole]);

  // Gera array de meses e anos para filtros
  const months = [
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  const currentYear = new Date().getFullYear();
  // Generate years from current year to current year + 20
  const years = Array.from({ length: 21 }, (_, i) => {
    const year = currentYear + i;
    return { value: year.toString(), label: year.toString() };
  });
  const router = useRouter();

  // Create a global filter state
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Function to determine if a patient passes our custom filters
  const filterPatients = React.useCallback(
    (patient: Patient) => {
      const exams = patient.exams || [];

      // Filter by exam presence
      if (hasExamFilter !== "all") {
        const hasExams = exams.length > 0;
        if (hasExamFilter === "yes" && !hasExams) return false;
        if (hasExamFilter === "no" && hasExams) return false;
      }

      // Apply date filters if the patient has exams
      if ((monthFilter !== "all" || yearFilter !== "all") && exams.length > 0) {
        // Check if any exam matches our date filters
        const matchesDateFilter = exams.some((exam) => {
          if (!exam.exam_date) return false;
          const examDate = new Date(exam.exam_date);

          // Month filter
          if (monthFilter !== "all") {
            const examMonth = (examDate.getMonth() + 1)
              .toString()
              .padStart(2, "0");
            if (examMonth !== monthFilter) return false;
          }

          // Year filter
          if (yearFilter !== "all") {
            const examYear = examDate.getFullYear().toString();
            if (examYear !== yearFilter) return false;
          }

          return true;
        });

        if (!matchesDateFilter) return false;
      }

      // Filter by clinic (for admin users)
      if (userRole === "admin" && clinicFilter !== "all") {
        if (patient.clinic_id !== clinicFilter) return false;
      }

      return true;
    },
    [monthFilter, yearFilter, hasExamFilter, clinicFilter, userRole]
  );

  // Update the global filter when our custom filters change
  React.useEffect(() => {
    // Force a re-filter by toggling the global filter
    setGlobalFilter((prev) => (prev === "1" ? "2" : "1"));
  }, [monthFilter, yearFilter, hasExamFilter, clinicFilter]);

  // Function to sort exams based on the selected sort order
  const getSortedExams = React.useCallback(
    (exams: Exam[]) => {
      if (!exams || exams.length === 0) return [];

      return [...exams].sort((a, b) => {
        if (!a.exam_date) return 1; // Null dates go to the end
        if (!b.exam_date) return -1;

        const dateA = new Date(a.exam_date);
        const dateB = new Date(b.exam_date);

        // Sort by year
        if (sortOrder.startsWith("year")) {
          const yearDiff = dateA.getFullYear() - dateB.getFullYear();
          if (yearDiff !== 0) {
            return sortOrder === "year-asc" ? yearDiff : -yearDiff;
          }
          // If years are the same, sort by month
          const monthDiff = dateA.getMonth() - dateB.getMonth();
          return sortOrder === "year-asc" ? monthDiff : -monthDiff;
        }
        // Sort by month
        else if (sortOrder.startsWith("month")) {
          const monthDiff = dateA.getMonth() - dateB.getMonth();
          if (monthDiff !== 0) {
            return sortOrder === "month-asc" ? monthDiff : -monthDiff;
          }
          // If months are the same, sort by year
          const yearDiff = dateA.getFullYear() - dateB.getFullYear();
          return sortOrder === "month-asc" ? yearDiff : -yearDiff;
        }

        return 0;
      });
    },
    [sortOrder]
  );

  // Apply sorting based on sortOrder for the main table
  React.useEffect(() => {
    // The main table sorting remains by patient name
    // This doesn't change as we're sorting the exams within each patient
    setSorting([{ id: "name", desc: false }]);
  }, [sortOrder]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
      expanded,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onExpandedChange: setExpanded,
    getExpandedRowModel: getExpandedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowCanExpand: (row) => {
      const patient = row.original as unknown as Patient;
      const exams = patient.exams || [];
      return exams.length > 0;
    },
    filterFns: {
      customFilter: (row) => {
        // Use the filterPatients callback directly from the component scope
        const patient = row.original as unknown as Patient;
        // Check if patient passes our custom filters
        const exams = patient.exams || [];

        // Filter by exam presence
        if (hasExamFilter !== "all") {
          const hasExams = exams.length > 0;
          if (hasExamFilter === "yes" && !hasExams) return false;
          if (hasExamFilter === "no" && hasExams) return false;
        }

        // Apply date filters if the patient has exams
        if (
          (monthFilter !== "all" || yearFilter !== "all") &&
          exams.length > 0
        ) {
          // Check if any exam matches our date filters
          const matchesDateFilter = exams.some((exam) => {
            if (!exam.exam_date) return false;
            const examDate = new Date(exam.exam_date);

            // Month filter
            if (monthFilter !== "all") {
              const examMonth = (examDate.getMonth() + 1)
                .toString()
                .padStart(2, "0");
              if (examMonth !== monthFilter) return false;
            }

            // Year filter
            if (yearFilter !== "all") {
              const examYear = examDate.getFullYear().toString();
              if (examYear !== yearFilter) return false;
            }

            return true;
          });

          if (!matchesDateFilter) return false;
        }

        // Filter by clinic (for admin users)
        if (userRole === "admin" && clinicFilter !== "all") {
          if (patient.clinic_id !== clinicFilter) return false;
        }

        return true;
      },
    },
    globalFilterFn: "customFilter" as any, // Type assertion to fix TypeScript error
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filtrar pacientes..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="ml-2">
                <IconFilter className="mr-2 h-4 w-4" />
                <span>Filtrar</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Opções de Filtro</h4>
                  <p className="text-sm text-muted-foreground">
                    Filtrar pacientes por vários critérios
                  </p>
                </div>

                {/* Patients Section */}
                <div className="border rounded-md p-3 mb-3">
                  <h5 className="text-sm font-medium mb-2">Pacientes</h5>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="hasExam">Tem exame?</Label>
                      <Select
                        value={hasExamFilter}
                        onValueChange={setHasExamFilter}
                      >
                        <SelectTrigger className="col-span-2">
                          <SelectValue placeholder="Selecione uma opção" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            Todos os Pacientes
                          </SelectItem>
                          <SelectItem value="yes">Sim</SelectItem>
                          <SelectItem value="no">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Exams Section */}
                <div className="border rounded-md p-3 mb-3">
                  <h5 className="text-sm font-medium mb-2">Exames</h5>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="year">Ano</Label>
                      <Select value={yearFilter} onValueChange={setYearFilter}>
                        <SelectTrigger className="col-span-2">
                          <SelectValue placeholder="Selecione o ano" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os Anos</SelectItem>
                          {years.map((year) => (
                            <SelectItem key={year.value} value={year.value}>
                              {year.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="month">Mês</Label>
                      <Select
                        value={monthFilter}
                        onValueChange={setMonthFilter}
                      >
                        <SelectTrigger className="col-span-2">
                          <SelectValue placeholder="Selecione o mês" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os Meses</SelectItem>
                          {months.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="sortOrder">Ordenar por</Label>
                      <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger className="col-span-2">
                          <SelectValue placeholder="Selecione a ordem" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="year-asc">
                            Ano (Crescente)
                          </SelectItem>
                          <SelectItem value="year-desc">
                            Ano (Decrescente)
                          </SelectItem>
                          <SelectItem value="month-asc">
                            Mês (Crescente)
                          </SelectItem>
                          <SelectItem value="month-desc">
                            Mês (Decrescente)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Employer Section - Only for admin users */}
                {userRole === "admin" && (
                  <div className="border rounded-md p-3 mb-3">
                    <h5 className="text-sm font-medium mb-2">Empregador</h5>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="clinic">Nome</Label>
                        <Select
                          value={clinicFilter}
                          onValueChange={setClinicFilter}
                        >
                          <SelectTrigger className="col-span-2">
                            <SelectValue placeholder="Selecione o empregador" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              Todos os Empregadores
                            </SelectItem>
                            {clinics.map((clinic) => (
                              <SelectItem
                                key={clinic.value}
                                value={clinic.value}
                              >
                                {clinic.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMonthFilter("all");
                      setYearFilter("all");
                      setHasExamFilter("all");
                      setClinicFilter("all");
                      setSortOrder("year-asc");
                    }}
                  >
                    Redefinir Filtros
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Colunas</span>
                <IconChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            onClick={() => router.push("/dashboard/add-patient")}
          >
            <IconPlus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Adicionar Paciente</span>
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const patient = row.original as unknown as Patient;
                const exams = patient.exams || [];
                const hasExams = exams.length > 0;

                return (
                  <React.Fragment key={row.id}>
                    <TableRow data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Expanded row for exams */}
                    {row.getIsExpanded() && hasExams && (
                      <TableRow className="bg-muted/50">
                        <TableCell
                          colSpan={row.getVisibleCells().length}
                          className="p-0"
                        >
                          <div className="p-4">
                            <h4 className="text-sm font-medium mb-2">
                              Exames de{" "}
                              {(row.original as unknown as Patient).name}
                            </h4>
                            <div className="border rounded-md">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b">
                                    <th className="p-2 text-left font-medium text-sm">
                                      Tipo de Exame
                                    </th>
                                    <th className="p-2 text-left font-medium text-sm">
                                      Data do exame
                                    </th>
                                    <th className="p-2 text-left font-medium text-sm">
                                      Compareceu ao exame?
                                    </th>
                                    <th className="p-2 text-left font-medium text-sm">
                                      Resultado
                                    </th>
                                    <th className="p-2 text-left font-medium text-sm">
                                      Observações
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {getSortedExams(exams).map((exam: Exam) => (
                                    <tr
                                      key={exam.id}
                                      className="border-b last:border-b-0"
                                    >
                                      <td className="p-2 text-sm">
                                        {exam.exam_type}
                                      </td>
                                      <td className="p-2 text-sm">
                                        {exam.exam_date
                                          ? format(
                                              new Date(exam.exam_date),
                                              "PP"
                                            )
                                          : "Não agendado"}
                                      </td>
                                      <td className="p-2 text-sm">
                                        <Badge
                                          variant={
                                            exam.appeared_on_exam === true
                                              ? "default"
                                              : exam.appeared_on_exam === false
                                              ? "destructive"
                                              : "outline"
                                          }
                                          className={`px-1.5 ${
                                            exam.appeared_on_exam === true
                                              ? "bg-green-500 hover:bg-green-500/90 text-white"
                                              : ""
                                          }`}
                                        >
                                          {exam.appeared_on_exam === true
                                            ? "Compareceu"
                                            : exam.appeared_on_exam === false
                                            ? "Faltou"
                                            : "Não registrado"}
                                        </Badge>
                                      </td>
                                      <td className="p-2 text-sm">
                                        {exam.result || "Sem resultado"}
                                      </td>
                                      <td className="p-2 text-sm">
                                        {exam.notes || "Sem observações"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum paciente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Linhas por página</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Ir para primeira página</span>
              <IconChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Ir para página anterior</span>
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Ir para próxima página</span>
              <IconChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Ir para última página</span>
              <IconChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
