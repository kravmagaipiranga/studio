
"use client"

import { useMemo } from "react"
import { collection, query, where } from "firebase/firestore"
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { Payment, Student } from "@/lib/types"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "../ui/skeleton"
import { DollarSign, UserPlus, FileText, Clock } from "lucide-react"

export function PaymentSummary() {
  const firestore = useFirestore();
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'payments'));
  }, [firestore]);

  const studentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'students'), where('status', '==', 'Ativo'));
  }, [firestore]);

  const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsQuery);
  const { data: activeStudents, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);

  const isLoading = isLoadingPayments || isLoadingStudents;

  const summary = useMemo(() => {
    const initialSummary = {
      monthly: { count: 0, total: 0 },
      quarterly: { count: 0, total: 0 },
      enrollment: { count: 0, total: 0 },
      pending: { count: 0, total: 0 },
    };

    if (!payments || !activeStudents) return initialSummary;

    const paymentsThisMonth = payments.filter(payment => {
        try {
            const paymentDate = parseISO(payment.paymentDate);
            return isWithinInterval(paymentDate, { start: monthStart, end: monthEnd });
        } catch(e) { return false; }
    });

    const paidStudentIds = new Set(paymentsThisMonth.map(p => p.studentId));

    const pendingStudents = activeStudents.filter(student => 
        !paidStudentIds.has(student.id) && 
        student.planType !== 'Bolsa 100%' // Exclude 100% scholarship from pending
    );

    initialSummary.pending.count = pendingStudents.length;
    initialSummary.pending.total = pendingStudents.reduce((acc, student) => acc + (student.planValue || 0), 0);

    return paymentsThisMonth.reduce((acc, payment) => {
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
        return acc;
    }, initialSummary);

  }, [payments, activeStudents, monthStart, monthEnd]);

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
                <div className="flex items-center justify-between rounded-lg border p-4 bg-amber-50 dark:bg-amber-950">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-800">
                            <Clock className="h-6 w-6 text-amber-600 dark:text-amber-300" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Previsão de Recebimentos</p>
                            <p className="text-sm text-foreground">{summary.pending.count} alunos pendentes</p>
                        </div>
                    </div>
                    <p className="text-lg font-bold text-amber-800 dark:text-amber-200">{formatCurrency(summary.pending.total)}</p>
                </div>
            </>
        )}
      </CardContent>
    </Card>
  )
}

    