"use client";

import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, getMonth, getYear } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
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
import { cn } from "@/lib/utils";

// Define the form schema
const formSchema = z.object({
  exam_type: z.string().min(1, { message: "Tipo de exame é obrigatório" }),
  exam_date: z.date({
    required_error: "Data do exame é obrigatória",
  }),
  result: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  appeared_on_exam: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface ExamFormProps {
  patientId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ExamForm({ patientId, onSuccess, onCancel }: ExamFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examCalendarDate, setExamCalendarDate] = useState<Date | undefined>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  // Define default values
  const defaultValues = {
    exam_type: "",
    exam_date: new Date(),
    result: "",
    notes: "",
    appeared_on_exam: false,
  };

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Insert the exam into the database
      const { error } = await supabase.from("exams").insert({
        patient_id: patientId,
        exam_type: data.exam_type,
        exam_date: format(data.exam_date, "yyyy-MM-dd"),
        result: data.result || null,
        notes: data.notes || null,
        appeared_on_exam: data.appeared_on_exam,
      });

      if (error) {
        throw error;
      }

      toast.success("Exame criado com sucesso");

      // Reset form and call onSuccess callback
      form.reset(defaultValues);
      router.refresh();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Erro ao criar exame:", error);
      toast.error(error.message || "Ocorreu um erro ao criar o exame");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="exam_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Exame</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de exame" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Admissional">Admissional</SelectItem>
                    <SelectItem value="Demissional">Demissional</SelectItem>
                    <SelectItem value="Periódico">Periódico</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="exam_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data do Exame</FormLabel>
                <Popover modal={true}>
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
                  <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={4}>
                    <div className="p-3">
                      <div className="mb-2 flex justify-center gap-2">
                        <Select
                          value={
                            field.value
                              ? getMonth(field.value).toString()
                              : getMonth(new Date()).toString()
                          }
                          onValueChange={(value) => {
                            const currentDate =
                              examCalendarDate || new Date();
                            const newDate = new Date(currentDate);
                            newDate.setMonth(parseInt(value));
                            setExamCalendarDate(newDate);
                            setCalendarMonth(newDate);
                            field.onChange(newDate);
                          }}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Mês" />
                          </SelectTrigger>
                          <SelectContent>
                            {
                              [
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
                              ))
                            }
                          </SelectContent>
                        </Select>

                        <Select
                          value={
                            field.value
                              ? getYear(field.value).toString()
                              : getYear(new Date()).toString()
                          }
                          onValueChange={(value) => {
                            const currentDate =
                              examCalendarDate || new Date();
                            const newDate = new Date(currentDate);
                            newDate.setFullYear(parseInt(value));
                            setExamCalendarDate(newDate);
                            setCalendarMonth(newDate);
                            field.onChange(newDate);
                          }}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Ano" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 16 }, (_, i) => {
                              const year = getYear(new Date()) + i;
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
                          setExamCalendarDate(date);
                          if (date) {
                            setCalendarMonth(date);
                          }
                        }}
                        month={calendarMonth}
                        disabled={(date) => {
                          // Get the current date
                          const currentDate = new Date();
                          // Calculate the date 15 years from now
                          const futureDate = new Date();
                          futureDate.setFullYear(currentDate.getFullYear() + 15);
                          // Disable dates before today or after 15 years from now
                          return date < currentDate || date > futureDate;
                        }}
                        initialFocus
                      />
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="result"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resultado</FormLabel>
              <FormControl>
                <Input
                  placeholder="Insira o resultado do exame"
                  className="min-h-[100px]"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Input
                  placeholder="Insira observações adicionais"
                  className="min-h-[100px]"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="appeared_on_exam"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Compareceu ao Exame</FormLabel>
                <FormDescription>
                  Marque se o paciente compareceu ao exame
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Criando..." : "Criar Exame"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
