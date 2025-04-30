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
    exam_date: undefined,
    appeared_on_exam: false,
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
  const [examCalendarDate, setExamCalendarDate] = useState<Date | undefined>(
    defaultValues.exam_date
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
        <CardTitle>Patient Information</CardTitle>
        <CardDescription>
          Enter the details for the new patient.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
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
                                <span>Pick a date</span>
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
                                onValueChange={handleYearChange}
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
                    <FormLabel>Gender</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
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
              render={({ field }) => {
                // Update exam calendar date when field value changes
                useEffect(() => {
                  if (field.value) {
                    setExamCalendarDate(field.value);
                  }
                }, [field.value]);

                // Handler for month change
                const handleMonthChange = (value: string) => {
                  const currentDate = examCalendarDate || new Date();
                  const newDate = new Date(currentDate);
                  newDate.setMonth(parseInt(value));
                  setExamCalendarDate(newDate);
                  field.onChange(newDate);
                };

                // Handler for year change
                const handleYearChange = (value: string) => {
                  const currentDate = examCalendarDate || new Date();
                  const newDate = new Date(currentDate);
                  newDate.setFullYear(parseInt(value));
                  setExamCalendarDate(newDate);
                  field.onChange(newDate);
                };

                return (
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
                              <span>Pick a date</span>
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
                              onValueChange={handleYearChange}
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
                );
              }}
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
                        placeholder="patient@example.com"
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
                      <Input placeholder="Phone number" {...field} />
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
                    <Input placeholder="Patient address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showClinicSelector && clinics.length > 0 && (
              <FormField
                control={form.control}
                name="clinic_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinic</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select clinic" />
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
                      Select the clinic for this patient
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
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Patient"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
