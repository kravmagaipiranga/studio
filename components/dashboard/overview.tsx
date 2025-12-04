'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DollarSign, Users, CreditCard } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Student } from "@/lib/types";
import { collection } from "firebase/firestore";
import { useMemo } from "react";

export function Overview() {
  const firestore = useFirestore();

  const studentsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'students');
  }, [firestore]);

  const { data: students, isLoading } = useCollection<Student>(studentsCollection);

  const { totalRevenue, activeStudents, overduePayments } = useMemo(() => {
    if (!students) {
      return { totalRevenue: 0, activeStudents: 0, overduePayments: 0 };
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const revenue = students.reduce((acc, student) => {
      if (student.lastPaymentDate) {
        const paymentDate = new Date(student.lastPaymentDate);
        if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
          return acc + (student.planValue || 0);
        }
      }
      return acc;
    }, 0);

    const active = students.filter(s => s.status === 'Ativo').length;
    const overdue = students.filter(s => s.paymentStatus === 'Vencido').length;

    return { totalRevenue: revenue, activeStudents: active, overduePayments: overdue };
  }, [students]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Receita Total (Mês)
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
           <p className="text-xs text-muted-foreground">
            {isLoading ? 'Calculando...' : 'Receita do mês atual'}
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
          <div className="text-2xl font-bold">+{activeStudents}</div>
           <p className="text-xs text-muted-foreground">
            {isLoading ? 'Carregando...' : 'Total de alunos com status ativo'}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pagamentos Vencidos</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{overduePayments}</div>
           <p className="text-xs text-muted-foreground">
            {isLoading ? 'Carregando...' : 'Total de mensalidades em atraso'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
