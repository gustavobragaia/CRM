"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { supabase } from "@/lib/supabase/client";

type ExamTypeData = {
  name: string;
  value: number;
  fill?: string;
};

// Configuração do gráfico com cores em formato hex conforme documentação
const chartConfig = {
  value: {
    label: "Quantidade",
    color: "#2563eb", // Azul principal
  },
  color1: {
    label: "Cor 1",
    color: "#2563eb", // Azul claro
  },
  color2: {
    label: "Cor 2",
    color: "#2563eb", // Amarelo
  },
  color3: {
    label: "Cor 3",
    color: "#2563eb", // Verde
  },
  color4: {
    label: "Cor 4",
    color: "#2563eb", // Vermelho
  },
} satisfies ChartConfig;

export function ExamTypeChart() {
  const [chartData, setChartData] = useState<ExamTypeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalExams, setTotalExams] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);

  // Cor azul para todos os itens
  const examColor = "#2563eb"; // Azul

  useEffect(() => {
    async function fetchExamTypeData() {
      try {
        setIsLoading(true);

        // Obter o usuário autenticado
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!authData.user) {
          setChartData([]);
          return;
        }

        setUser(authData.user);

        // Obter dados do usuário incluindo função
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("email", authData.user.email)
          .single();

        if (userError) {
          console.error("Erro ao buscar dados do usuário:", userError);
          // Continuar mesmo com erro, tentando buscar todos os exames
        } else {
          setUserData(userData);
        }

        // Consulta base para exames
        let query = supabase
          .from("exams")
          .select("exam_type, patient_id, patients!inner(clinic_id)");
        
        // Filtrar por clinic_id se o usuário for do tipo clínica
        if (userData && userData.user_type === "clinic" && userData.clinic_id) {
          query = query.eq("patients.clinic_id", userData.clinic_id);
        }
        
        const { data, error } = await query;

        if (error) {
          throw error;
        }

        if (!data) {
          setChartData([]);
          return;
        }

        // Contar ocorrências de cada tipo de exame
        const examTypeCounts: Record<string, number> = {};
        data.forEach((exam) => {
          const examType = exam.exam_type;
          examTypeCounts[examType] = (examTypeCounts[examType] || 0) + 1;
        });

        // Converter para o formato de dados do gráfico
        const formattedData = Object.entries(examTypeCounts).map(
          ([type, count]) => ({
            name: type, // Nome do tipo de exame
            value: count, // Valor da contagem
            fill: examColor, // Mesma cor azul para todos
          })
        );

        // Ordenar por contagem em ordem decrescente
        formattedData.sort((a, b) => b.value - a.value);

        setChartData(formattedData);
        setTotalExams(data.length);
      } catch (err) {
        console.error("Erro ao buscar dados de tipos de exame:", err);
        setError("Falha ao carregar dados de tipos de exame");
      } finally {
        setIsLoading(false);
      }
    }

    fetchExamTypeData();
  }, []);
  
  // Determinar o título baseado no tipo de usuário
  const getChartTitle = () => {
    if (userData && userData.user_type === "clinic") {
      return "Distribuição de Tipos de Exames da Clínica";
    }
    return "Distribuição de Tipos de Exames";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Tipos de Exames</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Tipos de Exames</CardTitle>
          <CardDescription>Erro: {error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getChartTitle()}</CardTitle>
        <CardDescription>Distribuição por tipo de exame</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={8} fill={examColor}>
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
                dataKey="value"
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {totalExams} exames registrados no total{" "}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          {userData && userData.user_type === "clinic" 
            ? "Mostrando distribuição dos tipos de exames da sua clínica" 
            : "Mostrando distribuição de todos os tipos de exames"}
        </div>
      </CardFooter>
    </Card>
  );
}
