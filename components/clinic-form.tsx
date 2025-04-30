"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseClient } from "@/lib/supabase-client";

// Define the form schema with Zod
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Clinic name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export type ClinicFormValues = z.infer<typeof formSchema>;

interface ClinicFormProps {
  onSubmit: (values: ClinicFormValues) => Promise<void>;
  defaultValues?: Partial<ClinicFormValues>;
  isSubmitting?: boolean;
}

export function ClinicForm({ 
  onSubmit, 
  defaultValues = {
    name: "",
    email: "",
    password: "",
    address: "",
    phone: "",
  },
  isSubmitting = false 
}: ClinicFormProps) {
  const router = useRouter();
  
  // Initialize form with react-hook-form and zod resolver
  const form = useForm<ClinicFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Handle form submission
  const handleSubmit = async (values: ClinicFormValues) => {
    try {
      await onSubmit(values);
    } catch (error: any) {
      console.error("Error in clinic form:", error);
      toast.error(error.message || "An error occurred");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clinic Information</CardTitle>
        <CardDescription>
          Enter the details for the new clinic. This will create both a user account and a clinic record.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinic Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter clinic name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="clinic@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      This will be used for login and communication.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Create a password" {...field} />
                  </FormControl>
                  <FormDescription>
                    Must be at least 8 characters.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Clinic address (optional)" {...field} />
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
                      <Input placeholder="Phone number (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
                {isSubmitting ? "Adding..." : "Add Clinic"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
