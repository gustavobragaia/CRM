"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase-client";
import { Patient } from "@/app/dashboard/patients/columns";

// Define the form schema with Zod
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Patient name must be at least 2 characters.",
  }),
  birth_date: z.date().optional(),
  exam_date: z.date().optional(),
  gender: z.string().optional(),
  email: z
    .string()
    .email({
      message: "Please enter a valid email address.",
    })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  clinic_id: z.string().optional(),
  appeared_on_exam: z.boolean().optional(),
});

type PatientFormValues = z.infer<typeof formSchema>;

interface PatientClientFormProps {
  patientData: Patient;
}

export function PatientClientForm({ patientData }: PatientClientFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [birthCalendarDate, setBirthCalendarDate] = useState<Date | undefined>(
    patientData.birth_date ? new Date(patientData.birth_date) : undefined
  );
  const [examCalendarDate, setExamCalendarDate] = useState<Date | undefined>(
    patientData.exam_date ? new Date(patientData.exam_date) : undefined
  );

  // Initialize form with react-hook-form and zod resolver
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: patientData.name,
      birth_date: patientData.birth_date
        ? new Date(patientData.birth_date)
        : undefined,
      exam_date: patientData.exam_date
        ? new Date(patientData.exam_date)
        : undefined,
      gender: patientData.gender || "",
      email: patientData.email || "",
      phone: patientData.phone || "",
      address: patientData.address || "",
      clinic_id: patientData.clinic_id,
      appeared_on_exam: patientData.appeared_on_exam || false,
    },
  });

  // Handle form submission to update patient data
  const handleSubmit = async (values: PatientFormValues) => {
    setIsSubmitting(true);
    try {
      const supabase = getSupabaseClient();

      // Prepare the data for update
      const updateData = {
        name: values.name,
        birth_date: values.birth_date
          ? values.birth_date.toISOString().split("T")[0]
          : null,
        exam_date: values.exam_date
          ? values.exam_date.toISOString().split("T")[0]
          : null,
        gender: values.gender || null,
        email: values.email || null,
        phone: values.phone || null,
        address: values.address || null,
        appeared_on_exam: values.appeared_on_exam,
      };

      // Update the patient record
      const { error } = await supabase
        .from("patients")
        .update(updateData)
        .eq("id", patientData.id);

      if (error) throw error;

      toast.success("Patient updated successfully!");
      router.refresh(); // Refresh the page to show updated data
    } catch (error: any) {
      console.error("Error updating patient:", error);
      toast.error(error.message || "Failed to update patient");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Information</CardTitle>
        <CardDescription>View and edit patient details</CardDescription>
        <div className="flex gap-2 mt-2">
          <Badge variant="outline" className="text-muted-foreground">
            {patientData.gender || "Gender not specified"}
          </Badge>
          <Badge
            variant={
              patientData.appeared_on_exam === true
                ? "default"
                : patientData.appeared_on_exam === false
                ? "destructive"
                : "outline"
            }
            className={patientData.appeared_on_exam === true ? "bg-green-500 hover:bg-green-500/90 text-white" : ""}
          >
            {patientData.appeared_on_exam === true
              ? "Attended Exam"
              : patientData.appeared_on_exam === false
              ? "Missed Exam"
              : "Exam Attendance Unknown"}
          </Badge>
          <Badge variant={patientData.active ? "default" : "destructive"}>
            {patientData.active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Patient ID
                  </h3>
                  <p className="font-mono text-xs">{patientData.id}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Clinic ID
                  </h3>
                  <p className="font-mono text-xs">{patientData.clinic_id}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Created At
                  </h3>
                  <p>{new Date(patientData.created_at).toLocaleDateString()}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Active Status
                  </h3>
                  <p>{patientData.active ? "Active" : "Inactive"}</p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter patient full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="birth_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Birth</FormLabel>
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
                              <span>Not specified</span>
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
                              onValueChange={(value) => {
                                const currentDate = birthCalendarDate || new Date();
                                const newDate = new Date(currentDate);
                                newDate.setMonth(parseInt(value));
                                setBirthCalendarDate(newDate);
                                field.onChange(newDate);
                              }}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Month" />
                              </SelectTrigger>
                              <SelectContent>
                                {[
                                  "January",
                                  "February",
                                  "March",
                                  "April",
                                  "May",
                                  "June",
                                  "July",
                                  "August",
                                  "September",
                                  "October",
                                  "November",
                                  "December",
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
                              onValueChange={(value) => {
                                const currentDate = birthCalendarDate || new Date();
                                const newDate = new Date(currentDate);
                                newDate.setFullYear(parseInt(value));
                                setBirthCalendarDate(newDate);
                                field.onChange(newDate);
                              }}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="Year" />
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
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Not specified" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="exam_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Exam Date</FormLabel>
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
                            <span>Not scheduled</span>
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
                            onValueChange={(value) => {
                              const currentDate = examCalendarDate || new Date();
                              const newDate = new Date(currentDate);
                              newDate.setMonth(parseInt(value));
                              setExamCalendarDate(newDate);
                              field.onChange(newDate);
                            }}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                              {[
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December",
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
                            onValueChange={(value) => {
                              const currentDate = examCalendarDate || new Date();
                              const newDate = new Date(currentDate);
                              newDate.setFullYear(parseInt(value));
                              setExamCalendarDate(newDate);
                              field.onChange(newDate);
                            }}
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 10 }, (_, i) => {
                                const year = getYear(new Date()) - i + 5;
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
                          }}
                          defaultMonth={examCalendarDate}
                          month={examCalendarDate}
                          initialFocus
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Date when the patient should have their exam
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        placeholder="Not provided"
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Not provided" {...field} />
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
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Not provided" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="appeared_on_exam"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Appeared on Exam</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "true")}
                    defaultValue={field.value ? "true" : "false"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardFooter className="flex justify-end px-0 pb-0">
              <Button
                type="button"
                variant="outline"
                className="mr-2"
                onClick={() => router.push("/dashboard/patients")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Patient"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
