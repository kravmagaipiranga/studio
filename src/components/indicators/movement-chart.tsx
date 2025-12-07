"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts"
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

interface MovementChartProps {
  data: MonthlyIndicator[];
}

export function MovementChart({ data }: MovementChartProps) {
  const chartData = data.map(item => ({
    month: monthNames[item.month - 1],
    visits: item.visits || 0,
    trialClasses: item.trialClasses || 0,
    newEnrollments: item.newEnrollments || 0,
    reenrollments: item.reenrollments || 0,
    exits: item.exits || 0,
  }));

  const chartConfig = {
    visits: { label: "Visitas", color: "#60a5fa" }, // blue-400
    trialClasses: { label: "Aulas Exp.", color: "#fbbf24" }, // amber-400
    newEnrollments: { label: "Matrículas", color: "#34d399" }, // emerald-400
    reenrollments: { label: "Rematrículas", color: "#a78bfa" }, // violet-400
    exits: { label: "Saídas", color: "#f87171" }, // red-400
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimentação Mensal</CardTitle>
        <CardDescription>Comparativo de visitas, aulas, matrículas e saídas.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
           <ResponsiveContainer width="100%" height={400}>
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
                <Bar dataKey="visits" fill="var(--color-visits)" radius={4} />
                <Bar dataKey="trialClasses" fill="var(--color-trialClasses)" radius={4} />
                <Bar dataKey="newEnrollments" fill="var(--color-newEnrollments)" radius={4} />
                <Bar dataKey="reenrollments" fill="var(--color-reenrollments)" radius={4} />
                <Bar dataKey="exits" fill="var(--color-exits)" radius={4} />
            </BarChart>
           </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
