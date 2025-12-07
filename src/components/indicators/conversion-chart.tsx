"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { MonthlyIndicator } from "@/lib/types"

const monthNames = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

interface ConversionChartProps {
  data: MonthlyIndicator[];
}

export function ConversionChart({ data }: ConversionChartProps) {
  const chartData = data.map(item => ({
    month: monthNames[item.month - 1],
    trialClasses: item.trialClasses || 0,
    newEnrollments: item.newEnrollments || 0,
  }));

  const chartConfig = {
    trialClasses: { label: "Aulas de Experiência", color: "#fbbf24" }, // amber-400
    newEnrollments: { label: "Novas Matrículas", color: "#34d399" }, // emerald-400
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversão de Aulas em Matrículas</CardTitle>
        <CardDescription>Comparativo entre aulas de experiência e novas matrículas.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
           <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                />
                <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="trialClasses" fill="var(--color-trialClasses)" radius={4} />
                <Bar dataKey="newEnrollments" fill="var(--color-newEnrollments)" radius={4} />
            </BarChart>
           </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
