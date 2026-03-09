
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DollarSign, Users } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Student, Payment } from "@/lib/types";
import { collection, query } from "firebase/firestore";
import { useMemo } from "react";
import { isWithinInterval, startOfMonth, endOfMonth, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function Overview() {
  const firestore = useFirestore();
  const today = new Date();
  const monthName = format(today, 'MMMM', { locale: ptBR });

  const studentsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'students');
  }, [firestore]);

  const paymentsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'payments');
  }, [firestore]);

  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsCollection);
  const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsCollection);
  
  const isLoading = isLoadingStudents || isLoadingPayments;

  const { totalRevenue, activeStudents } = useMemo(() => {
    const todayRef = new Date();
    const monthStart = startOfMonth(todayRef);
    const monthEnd = endOfMonth(todayRef);

    const revenue = payments
      ?.filter(p => {
          try {
              const paymentDate = parseISO(p.paymentDate);
              return isWithinInterval(paymentDate, { start: monthStart, end: monthEnd });
          } catch {
              return false;
          }
      })
      .reduce((acc, p) => acc + (p.amount || 0), 0) || 0;

    const active = students?.filter(s => s.status === 'Ativo').length || 0;
    
    return { totalRevenue: revenue, activeStudents: active };
  }, [students, payments]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
            Receita Total ({monthName})
          </CardTitle>
          <DollarSign className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-emerald-900 dark:text-emerald-100">
            {isLoading ? "..." : `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </div>
           <p className="text-xs text-emerald-700/70 dark:text-emerald-500/70 mt-1">
            Pagamentos recebidos no mês vigente.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Alunos Ativos
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black">{isLoading ? "..." : activeStudents}</div>
           <p className="text-xs text-muted-foreground mt-1">
            Total de matrículas ativas no CT.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
