
"use client"

import { useMemo } from "react"
import { collection, query, where } from "firebase/firestore"
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { Payment } from "@/lib/types"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "../ui/skeleton"
import { DollarSign, UserPlus, FileText } from "lucide-react"

export function PaymentSummary() {
  const firestore = useFirestore();
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  // Firestore doesn't support querying by month directly from a timestamp efficiently.
  // It's better to fetch recent payments and filter on the client.
  // For larger datasets, one might create a 'year_month' field in the document.
  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'payments'));
  }, [firestore]);

  const { data: payments, isLoading } = useCollection<Payment>(paymentsQuery);

  const summary = useMemo(() => {
    const initialSummary = {
      monthly: { count: 0, total: 0 },
      quarterly: { count: 0, total: 0 },
      enrollment: { count: 0, total: 0 },
    };

    if (!payments) return initialSummary;

    return payments.reduce((acc, payment) => {
        try {
            const paymentDate = parseISO(payment.paymentDate);
            if (isWithinInterval(paymentDate, { start: monthStart, end: monthEnd })) {
                if (payment.planType === 'Mensal') {
                    acc.monthly.count++;
                    acc.monthly.total += payment.amount;
                } else if (payment.planType === 'Trimestral') {
                    acc.quarterly.count++;
                    acc.quarterly.total += payment.amount;
                } else if (payment.planType === 'Matrícula') {
                    acc.enrollment.count++;
                    acc.enrollment.total += payment.amount;
                }
            }
        } catch(e) {
            // Ignore invalid payment dates
        }
        return acc;
    }, initialSummary);

  }, [payments, monthStart, monthEnd]);

  const formatCurrency = (value: number) => {
     return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo de Pagamentos do Mês</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
            <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </>
        ) : (
            <>
                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                           <FileText className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Pagamentos Mensais</p>
                            <p className="text-sm text-foreground">{summary.monthly.count} pagamentos</p>
                        </div>
                    </div>
                    <p className="text-lg font-bold">{formatCurrency(summary.monthly.total)}</p>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                     <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                           <FileText className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Pagamentos Trimestrais</p>
                            <p className="text-sm text-foreground">{summary.quarterly.count} pagamentos</p>
                        </div>
                    </div>
                    <p className="text-lg font-bold">{formatCurrency(summary.quarterly.total)}</p>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4 bg-emerald-50 dark:bg-emerald-950">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-800">
                            <UserPlus className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Novas Matrículas</p>
                            <p className="text-sm text-foreground">{summary.enrollment.count} matrículas</p>
                        </div>
                    </div>
                    <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200">{formatCurrency(summary.enrollment.total)}</p>
                </div>
            </>
        )}
      </CardContent>
    </Card>
  )
}
