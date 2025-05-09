"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { format, getYear, getMonth } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

// Define o esquema do formulário com Zod
const formSchema = z.object({
  name: z.string().min(2, {
    message: "O nome do paciente deve ter pelo menos 2 caracteres.",
  }),
  birth_date: z.date().optional(),
  gender: z.string().optional(),
  email: z
    .string()
    .email({
      message: "Por favor, insira um endereço de e-mail válido.",
    })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  clinic_id: z.string().optional(),
  // Novos campos da estrutura do banco de dados
  rg: z.string().optional().or(z.literal("")),
  cpf: z.string().optional().or(z.literal("")),
  sector: z.string().optional().or(z.literal("")),
  position: z.string().optional().or(z.literal(""))
});

export type PatientFormValues = z.infer<typeof formSchema>;

interface Clinic {
  id: string;
  name: string;
}

interface PatientFormProps {
  onSubmit: (values: PatientFormValues) => Promise<void>;
  defaultValues?: Partial<PatientFormValues>;
  isSubmitting?: boolean;
  showClinicSelector?: boolean;
  clinics?: Clinic[];
}

export function PatientForm({
  onSubmit,
  defaultValues = {
    name: "",
    email: "",
    phone: "",
    address: "",
    gender: "",
    clinic_id: "",
    // New fields default values
    rg: "",
    cpf: "",
    sector: "",
    position: "",
  },
  isSubmitting = false,
  showClinicSelector = false,
  clinics = [],
}: PatientFormProps) {
  const router = useRouter();

  // State for calendar dates
  const [birthCalendarDate, setBirthCalendarDate] = useState<Date | undefined>(
    defaultValues.birth_date
  );

  // Initialize form with react-hook-form and zod resolver
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Handle form submission
  const handleSubmit = async (values: PatientFormValues) => {
    try {
      await onSubmit(values);
    } catch (error: any) {
      console.error("Error in patient form:", error);
      toast.error(error.message || "An error occurred");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações do Paciente</CardTitle>
        <CardDescription>
          Insira os detalhes para o novo paciente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Seção de Dados do Paciente */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Dados do Paciente</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Paciente</FormLabel>
                      <FormControl>
                        <Input placeholder="Insira o nome completo do paciente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="birth_date"
                    render={({ field }) => {
                      // Update birth calendar date when field value changes
                      useEffect(() => {
                        if (field.value) {
                          setBirthCalendarDate(field.value);
                        }
                      }, [field.value]);

                      // Handler for month change
                      const handleMonthChange = (value: string) => {
                        const currentDate = birthCalendarDate || new Date();
                        const newDate = new Date(currentDate);
                        newDate.setMonth(parseInt(value));
                        setBirthCalendarDate(newDate);
                        field.onChange(newDate);
                      };

                      // Handler for year change
                      const handleYearChange = (value: string) => {
                        const currentDate = birthCalendarDate || new Date();
                        const newDate = new Date(currentDate);
                        newDate.setFullYear(parseInt(value));
                        setBirthCalendarDate(newDate);
                        field.onChange(newDate);
                      };

                      return (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de Nascimento</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Selecione uma data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <div className="p-3">
                                <div className="mb-2 flex justify-center gap-2">
                                  <Select
                                    value={
                                      field.value
                                        ? getMonth(field.value).toString()
                                        : getMonth(new Date()).toString()
                                    }
                                    onValueChange={handleMonthChange}
                                  >
                                    <SelectTrigger className="w-[120px]">
                                      <SelectValue placeholder="Mês" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[
                                        "Janeiro",
                                        "Fevereiro",
                                        "Março",
                                        "Abril",
                                        "Maio",
                                        "Junho",
                                        "Julho",
                                        "Agosto",
                                        "Setembro",
                                        "Outubro",
                                        "Novembro",
                                        "Dezembro",
                                      ].map((month, index) => (
                                        <SelectItem
                                          key={month}
                                          value={index.toString()}
                                        >
                                          {month}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  <Select
                                    value={
                                      field.value
                                        ? getYear(field.value).toString()
                                        : getYear(new Date()).toString()
                                    }
                                    onValueChange={handleYearChange}
                                  >
                                    <SelectTrigger className="w-[100px]">
                                      <SelectValue placeholder="Ano" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: 125 }, (_, i) => {
                                        const year = getYear(new Date()) - i;
                                        return (
                                          <SelectItem
                                            key={year}
                                            value={year.toString()}
                                          >
                                            {year}
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => {
                                    field.onChange(date);
                                    setBirthCalendarDate(date);
                                  }}
                                  defaultMonth={birthCalendarDate}
                                  month={birthCalendarDate}
                                  disabled={(date) =>
                                    date > new Date() ||
                                    date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gênero</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o gênero" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Masculino</SelectItem>
                            <SelectItem value="female">Feminino</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="rg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RG</FormLabel>
                        <FormControl>
                          <Input placeholder="Documento RG" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input placeholder="Documento CPF" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Seção de Dados de Contato */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Dados de Contato</h3>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="paciente@exemplo.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="Número de telefone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Endereço do paciente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Seção de Dados do Empregador */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Dados do Empregador</h3>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="sector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Setor</FormLabel>
                        <FormControl>
                          <Input placeholder="Setor de trabalho" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cargo</FormLabel>
                        <FormControl>
                          <Input placeholder="Cargo de trabalho" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {showClinicSelector && clinics.length > 0 && (
              <FormField
                control={form.control}
                name="clinic_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clínica</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a clínica" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clinics.map((clinic) => (
                          <SelectItem key={clinic.id} value={clinic.id}>
                            {clinic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Selecione a clínica para este paciente
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <CardFooter className="flex justify-end px-0 pb-0">
              <Button
                type="button"
                variant="outline"
                className="mr-2"
                onClick={() => router.push("/dashboard")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adicionando..." : "Adicionar Paciente"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
