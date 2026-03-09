
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { Payment } from "@/lib/types"
import { useMemo } from "react"
import { parseISO, getMonth, getYear } from "date-fns"

const getMonthName = (monthIndex: number) => {
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return monthNames[monthIndex];
}

export function RevenueChart() {
    const firestore = useFirestore();
    const currentYear = new Date().getFullYear();

    const paymentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'payments');
    }, [firestore]);

    const { data: payments } = useCollection<Payment>(paymentsCollection);

    const revenueData = useMemo(() => {
        const monthlyRevenue: { [key: string]: number } = {};

        if (payments) {
            payments.forEach(payment => {
                if (payment.paymentDate) {
                    try {
                        const date = parseISO(payment.paymentDate);
                        // Filtra apenas pagamentos do ano atual
                        if (getYear(date) === currentYear) {
                            const monthName = getMonthName(getMonth(date));
                            monthlyRevenue[monthName] = (monthlyRevenue[monthName] || 0) + (payment.amount || 0);
                        }
                    } catch (e) {
                        // ignore invalid dates
                    }
                }
            });
        }
        
        const allMonths = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        return allMonths.map(month => ({
            month,
            revenue: monthlyRevenue[month] || 0
        }));

    }, [payments, currentYear]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Receita Mensal ({currentYear})</CardTitle>
        <CardDescription>Soma de transações realizadas em cada mês do ano vigente.</CardDescription>
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
              cursor={{ fill: 'hsl(var(--card))', opacity: 0.1 }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px'
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
