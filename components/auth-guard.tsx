"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";

// List of public routes that don't require authentication
const publicRoutes = ["/login", "/signup"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if the current route is a public route
        const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
        
        // If it's a public route, no need to check authentication
        if (isPublicRoute) {
          setIsLoading(false);
          return;
        }

        // Use the existing isAuthenticated function
        const authenticated = await isAuthenticated();
        
        // If not authenticated and not on a public route, redirect to login
        if (!authenticated) {
          router.push("/login");
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        // On error, redirect to login as a safety measure
        router.push("/login");
      }
    };

    checkAuth();

    // We still need the auth state listener for real-time changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: string) => {
        if (event === "SIGNED_OUT" && !publicRoutes.some(route => pathname.startsWith(route))) {
          router.push("/login");
        }
      }
    );

    // Cleanup function
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [pathname, router]);

  // Show nothing while checking authentication
  if (isLoading && !publicRoutes.some(route => pathname.startsWith(route))) {
    return <div className="flex items-center justify-center min-h-screen">Verificando autenticação...</div>;
  }

  return <>{children}</>;
}
