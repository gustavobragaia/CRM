"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "./ui/button";
import Link from "next/link";

export function AuthStatus() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      try {
        setLoading(true);
        // Tenta o método getUser
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          throw error;
        }

        console.log("Dados do usuário do lado do cliente:", data.user);
        setUser(data.user);
      } catch (err: any) {
        console.error("Erro ao obter usuário:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    getUser();
  }, []);

  if (loading) {
    return <div>Carregando status de autenticação...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-red-700 font-medium">Erro de Autenticação</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="font-medium">Não Autenticado</h3>
        <p className="mb-2">Você não está logado no momento.</p>
        <Button asChild size="sm">
          <Link href="/login">Entrar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
      <h3 className="font-medium">Autenticado</h3>
      <p>Logado como: {user.email}</p>
      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
        {JSON.stringify(user, null, 2)}
      </pre>
    </div>
  );
}
