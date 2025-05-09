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

// Configuração do gráfico com cor azul para todos os itens
const chartConfig = {
  desktop: {
    label: "Quantidade",
    color: "#2563eb", // Azul - cor principal
  },
  attended: {
    label: "Compareceu",
    color: "#2563eb", // Azul
  },
  missed: {
    label: "Não Compareceu",
    color: "#2563eb", // Azul
  },
  notInformed: {
    label: "Não Informado",
    color: "#2563eb", // Azul
  },
} satisfies ChartConfig;

// Tipo para os dados do gráfico
type ChartDataItem = {
  month: string;
  desktop: number;
  fill?: string;
};

export function ExamAttendanceChart() {
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalExams, setTotalExams] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  
  // Cor azul para todos os itens
  const examColor = "#2563eb";

  useEffect(() => {
    async function fetchExamAttendanceData() {
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
          .select("appeared_on_exam, patient_id, patients!inner(clinic_id)");
        
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

        // Contar ocorrências de comparecimento
        const attendanceCounts = {
          Compareceu: 0,
          "Não Compareceu": 0,
          "Não Informado": 0,
        };

        data.forEach((exam) => {
          if (exam.appeared_on_exam === true) {
            attendanceCounts["Compareceu"]++;
          } else if (exam.appeared_on_exam === false) {
            attendanceCounts["Não Compareceu"]++;
          } else {
            attendanceCounts["Não Informado"]++;
          }
        });

        // Converter para o formato de dados do gráfico
        const formattedData = Object.entries(attendanceCounts)
          .filter(([_, count]) => count > 0) // Remover categorias vazias
          .map(([status, count]) => ({
            month: status, // Usando 'month' como a chave conforme o exemplo do gráfico
            desktop: count, // Usando 'desktop' como a chave conforme o exemplo do gráfico
            fill: examColor, // Mesma cor azul para todos
          }));

        setChartData(formattedData);
        setTotalExams(data.length);
      } catch (err) {
        console.error("Erro ao buscar dados de comparecimento:", err);
        setError("Falha ao carregar dados de comparecimento");
      } finally {
        setIsLoading(false);
      }
    }

    fetchExamAttendanceData();
  }, []);
  
  // Determinar o título baseado no tipo de usuário
  const getChartTitle = () => {
    if (userData && userData.user_type === "clinic") {
      return "Comparecimento aos Exames da Clínica";
    }
    return "Comparecimento aos Exames";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparecimento aos Exames</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparecimento aos Exames</CardTitle>
          <CardDescription>Erro: {error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Calcular porcentagens para exibição
  const calculatePercentage = (value: number) => {
    return totalExams > 0 ? Math.round((value / totalExams) * 100) : 0;
  };

  // Encontrar o número de pacientes que compareceram
  const attendedCount =
    chartData.find((item) => item.month === "Compareceu")?.desktop || 0;
  const attendanceRate = calculatePercentage(attendedCount);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getChartTitle()}</CardTitle>
        <CardDescription>Taxa de comparecimento aos exames</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="desktop" radius={8} fill={examColor}>
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
                formatter={(value: number) =>
                  `${value} (${calculatePercentage(value)}%)`
                }
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {attendanceRate}% taxa de comparecimento ({attendedCount} de {totalExams}){" "}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          {userData && userData.user_type === "clinic" 
            ? "Baseado nos exames registrados da sua clínica" 
            : "Baseado em todos os exames registrados"}
        </div>
      </CardFooter>
    </Card>
  );
}
