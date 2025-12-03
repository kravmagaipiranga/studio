"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { Student } from "@/lib/types"
import { useMemo } from "react"

const getMonthName = (monthIndex: number) => {
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return monthNames[monthIndex];
}

export function RevenueChart() {
    const firestore = useFirestore();

    const studentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'students');
    }, [firestore]);

    const { data: students } = useCollection<Student>(studentsCollection);

    const revenueData = useMemo(() => {
        const monthlyRevenue: { [key: string]: number } = {};

        if (students) {
            students.forEach(student => {
                if (student.lastPaymentDate && student.planValue) {
                    try {
                        const paymentDate = new Date(student.lastPaymentDate + "T00:00:00");
                        const monthName = getMonthName(paymentDate.getMonth());
                        if (monthlyRevenue[monthName]) {
                            monthlyRevenue[monthName] += student.planValue;
                        } else {
                            monthlyRevenue[monthName] = student.planValue;
                        }
                    } catch (e) {
                        console.error("Invalid date for student payment", student.lastPaymentDate);
                    }
                }
            });
        }
        
        // Ensure all months are present, even with 0 revenue
        const allMonths = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        return allMonths.map(month => ({
            month,
            revenue: monthlyRevenue[month] || 0
        }));

    }, [students]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Receita Mensal</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={revenueData}>
            <XAxis
              dataKey="month"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$${value}`}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--card))' }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))'
              }}
               formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
            />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
