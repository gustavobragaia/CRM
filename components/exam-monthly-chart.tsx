"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { supabase } from "@/lib/supabase/client";

// Chart configuration
const chartConfig = {
  exams: {
    label: "Exames",
    color: "#2563eb", // Blue color
  },
} satisfies ChartConfig;

// Type for chart data
type MonthlyExamData = {
  month: string;
  exams: number;
};

export function ExamMonthlyChart() {
  const [chartData, setChartData] = useState<MonthlyExamData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );

  useEffect(() => {
    async function fetchMonthlyExamData() {
      try {
        setIsLoading(true);

        // Get authenticated user
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!authData.user) {
          setChartData([]);
          return;
        }

        setUser(authData.user);

        // Get user data including role
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("email", authData.user.email)
          .single();

        if (userError) {
          console.error("Error fetching user data:", userError);
          // Continue even with error, trying to fetch all exams
        } else {
          setUserData(userData);
        }

        // Base query for exams
        let query = supabase
          .from("exams")
          .select("exam_date, patient_id, patients!inner(clinic_id)");

        // Filter by clinic_id if user is clinic type
        if (userData && userData.user_type === "clinic" && userData.clinic_id) {
          query = query.eq("patients.clinic_id", userData.clinic_id);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        if (!data || data.length === 0) {
          setChartData([]);
          return;
        }

        // Group exams by month
        const examsByMonth: Record<string, number> = {};

        // Extract all years from exam data to populate the year filter
        const years = new Set<string>();
        data.forEach((exam) => {
          if (exam.exam_date) {
            const year = exam.exam_date.substring(0, 4); // Format: YYYY
            years.add(year);
          }
        });

        // Add current year and next year if they don't exist in data
        const currentYear = new Date().getFullYear();
        years.add(currentYear.toString());
        years.add((currentYear + 1).toString());

        // Sort years in ascending order (oldest first)
        const sortedYears = Array.from(years).sort((a, b) =>
          a.localeCompare(b)
        );
        setAvailableYears(sortedYears);

        // If selectedYear is not in the list, set it to the current year
        if (!sortedYears.includes(selectedYear)) {
          setSelectedYear(currentYear.toString());
        }

        // Get current date as the starting point
        const currentDate = new Date(parseInt(selectedYear), 0, 1); // January 1st of selected year
        const monthsToShow = 12;

        // Initialize all months for the selected year
        for (let i = 0; i < monthsToShow; i++) {
          const date = new Date(currentDate);
          date.setMonth(i); // Set to each month of the year
          const monthKey = date.toISOString().substring(0, 7); // Format: YYYY-MM
          examsByMonth[monthKey] = 0;
        }

        // Count exams by month
        // Only count exams from the selected year
        data.forEach((exam) => {
          if (exam.exam_date) {
            const examYear = exam.exam_date.substring(0, 4);
            // Only include exams from the selected year
            if (examYear === selectedYear) {
              const monthKey = exam.exam_date.substring(0, 7); // Format: YYYY-MM
              if (examsByMonth[monthKey] !== undefined) {
                examsByMonth[monthKey] += 1;
              }
            }
          }
        });

        // Convert to chart data format and sort by date (chronological order)
        const formattedData = Object.entries(examsByMonth)
          .map(([month, count]) => ({
            month,
            exams: count,
          }))
          .sort((a, b) => a.month.localeCompare(b.month)); // This will sort by YYYY-MM format

        setChartData(formattedData);
      } catch (err) {
        console.error("Error fetching monthly exam data:", err);
        setError("Failed to load monthly exam data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchMonthlyExamData();
  }, [selectedYear]);

  // Determine chart title based on user type
  const getChartTitle = () => {
    if (userData && userData.user_type === "clinic") {
      return "Quantidade de Exames por Mês da Clínica";
    }
    return "Quantidade de Exames por Mês";
  };

  // Get the total number of exams for the selected year
  const getTotalExamsForYear = () => {
    return chartData.reduce((total, item) => total + item.exams, 0);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quantidade de Exames por Mês</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quantidade de Exames por Mês</CardTitle>
          <CardDescription>Erro: {error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{getChartTitle()}</CardTitle>
          <CardDescription>
            Distribuição mensal de exames realizados
          </CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-row items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Escolha por ano:
            </span>
            <Select
              value={selectedYear}
              onValueChange={(value) => setSelectedYear(value)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Selecione o ano" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("pt-BR", {
                  month: "short",
                  year: "numeric",
                });
              }}
            />
            <YAxis />
            <Tooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="exams"
              stroke="#2563eb"
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
