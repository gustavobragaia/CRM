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

// No seu componente de cadastro
import { getSupabaseClient } from "@/lib/supabase-client";

// Função de cadastro
const handleSignup = async (
  email: string,
  password: string,
  name: string,
  userType: string
) => {
  const supabase = getSupabaseClient();

  // Criar usuário de autenticação
  const { data: authData, error: authError } =
    await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          user_type: userType,
        }
      }
    });

  if (authError) {
    console.error("Erro ao cadastrar:", authError.message);
    // Tratar erro
  } else {
    // Criar registro de usuário na tabela de usuários
    const { error: userError } = await supabase.from("users").insert({
      id: authData.user?.id,
      name,
      email,
      password: "HASHED_BY_SUPABASE", // Supabase gerencia a criptografia da senha
      user_type: userType,
    });

    if (userError) {
      console.error("Erro ao criar registro de usuário:", userError.message);
      // Tratar erro
    } else {
      // Redirecionar ou tratar cadastro bem-sucedido
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
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const userType = (formData.get("userType") as string) || "admin"; // Valor padrão

    // Validar confirmação de senha
    const confirmPassword = formData.get("confirmPassword") as string;
    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      setIsLoading(false);
      return;
    }

    try {
      await handleSignup(email, password, name, userType);
    } catch (err) {
      console.error("Erro de cadastro:", err);
      setError(
        err instanceof Error ? err.message : "Ocorreu um erro inesperado"
      );
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Criar uma conta</CardTitle>
          <CardDescription>
            Digite seus dados abaixo para criar sua conta
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
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="João Silva"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@exemplo.com"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  disabled={isLoading}
                />
              </div>
              <input type="hidden" name="userType" value="admin" />
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Cadastrando..." : "Cadastrar"}
                </Button>
                <Button variant="outline" className="w-full" type="button">
                  Cadastrar com Google
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Já possui uma conta?{" "}
              <Link href="/login" className="underline underline-offset-4">
                Entrar
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
