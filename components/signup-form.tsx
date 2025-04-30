"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

// In your signup form component
import { getSupabaseClient } from "@/lib/supabase-client";

// Signup function
const handleSignup = async (
  email: string,
  password: string,
  name: string,
  userType: string
) => {
  const supabase = getSupabaseClient();

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        user_type: userType,
      },
    },
  });

  if (authError) {
    console.error("Error signing up:", authError.message);
    // Handle error
  } else {
    // Create user record in your users table
    const { error: userError } = await supabase.from("users").insert({
      id: authData.user?.id,
      name,
      email,
      password: "HASHED_BY_SUPABASE", // Supabase handles password hashing
      user_type: userType,
    });

    if (userError) {
      console.error("Error creating user record:", userError.message);
      // Handle error
    } else {
      // Redirect or handle successful signup
      window.location.href = "/dashboard";
    }
  }
};

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const userType = formData.get('userType') as string || 'admin'; // Default value
    
    // Validate password confirmation
    const confirmPassword = formData.get('confirmPassword') as string;
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    try {
      await handleSignup(email, password, name, userType);
    } catch (err) {
      console.error("Signup error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Enter your details below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {error && (
                <div className="p-3 text-sm text-white bg-red-500 rounded">
                  {error}
                </div>
              )}
              <div className="grid gap-3">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" type="text" placeholder="John Doe" required disabled={isLoading} />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required disabled={isLoading} />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required disabled={isLoading} />
              </div>
              <input type="hidden" name="userType" value="admin" />
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing up..." : "Sign Up"}
                </Button>
                <Button variant="outline" className="w-full" type="button">
                  Sign Up with Google
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
