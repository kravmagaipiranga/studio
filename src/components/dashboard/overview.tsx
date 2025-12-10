
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
import { isWithinInterval, startOfMonth, endOfMonth, parseISO } from "date-fns";

export function Overview() {
  const firestore = useFirestore();

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

  const { totalRevenue, activeStudents, overduePayments } = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

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
    
    const overdue = students?.filter(s => {
        if (s.status !== 'Ativo') return false;
        if (!s.planExpirationDate) return true; 
        try {
            const expirationDate = parseISO(s.planExpirationDate);
            const todayStart = new Date();
            todayStart.setHours(0,0,0,0);
            return expirationDate < todayStart;
        } catch {
            return true;
        }
    }).length || 0;

    return { totalRevenue: revenue, activeStudents: active, overduePayments: overdue };
  }, [students, payments]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Receita Total (Mês)
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "..." : `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </div>
           <p className="text-xs text-muted-foreground">
            {isLoading ? 'Calculando...' : 'Receita de todos pagamentos no mês atual'}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Alunos Ativos
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isLoading ? "..." : `+${activeStudents}`}</div>
           <p className="text-xs text-muted-foreground">
            {isLoading ? 'Carregando...' : 'Total de alunos com status ativo'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
