
"use client";

import { useState, useMemo } from "react";
import { collection } from "firebase/firestore";
import { PaymentsTable } from "@/components/payments/payments-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search, AlertCircle, CheckCircle, ClipboardClock } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Student } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { parseISO, isAfter } from "date-fns";

export default function PagamentosPage() {
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState("");

    const studentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'students');
    }, [firestore]);

    const { data: students, isLoading } = useCollection<Student>(studentsCollection);

    const { paidInMonthCount, overdueCount, activeQuarterlyPlansCount } = useMemo(() => {
        if (!students) return { paidInMonthCount: 0, overdueCount: 0, activeQuarterlyPlansCount: 0 };
        
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const paidInMonth = students.filter(student => {
            if (!student.lastPaymentDate) return false;
            const paymentDate = new Date(student.lastPaymentDate);
            return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear && student.status === 'Ativo';
        }).length;

        const overdue = students.filter(s => s.paymentStatus === 'Vencido').length;

        const activeQuarterly = students.filter(student => {
            return student.planType === 'Trimestral' && 
                   student.status === 'Ativo' && 
                   student.planExpirationDate && 
                   isAfter(parseISO(student.planExpirationDate), today);
        }).length;
        
        return { paidInMonthCount: paidInMonth, overdueCount: overdue, activeQuarterlyPlansCount: activeQuarterly };

    }, [students]);

    const filteredStudents = useMemo(() => {
        if (!students) return [];

        return (students || [])
            .filter(student => student.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => {
                const dateA = a.lastPaymentDate ? parseISO(a.lastPaymentDate).getTime() : 0;
                const dateB = b.lastPaymentDate ? parseISO(b.lastPaymentDate).getTime() : 0;
                return dateB - dateA; // Sort by most recent payment date
            });

    }, [students, searchQuery]);


    return (
        <>
            <div className="grid gap-4 md:grid-cols-3 mb-4">
                <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                            Total de Alunos Ativos Pagantes
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                            {isLoading ? <Skeleton className="h-8 w-12"/> : paidInMonthCount}
                        </div>
                    </CardContent>
                </Card>
                 <Card className="bg-rose-50 border-rose-200 dark:bg-rose-950 dark:border-rose-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-rose-800 dark:text-rose-200">
                            Planos Vencidos
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    </CardHeader>
                    <CardContent>
                         <div className="text-2xl font-bold text-rose-900 dark:text-rose-100">
                             {isLoading ? <Skeleton className="h-8 w-12"/> : overdueCount}
                        </div>
                    </CardContent>
                </Card>
                 <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Planos Trimestrais Vigentes
                        </CardTitle>
                        <ClipboardClock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                         <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                             {isLoading ? <Skeleton className="h-8 w-12"/> : activeQuarterlyPlansCount}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Gestão de Pagamentos</h1>
                <div className="flex items-center gap-2">
                     <Link href="/pagamentos/novo/editar">
                        <Button>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Adicionar Pagamento
                        </Button>
                    </Link>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Gerar Relatório
                    </Button>
                </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por nome..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <DatePickerWithRange />
            </div>
             <div className="flex flex-1 rounded-lg shadow-sm mt-4">
                <PaymentsTable 
                    students={filteredStudents}
                    isLoading={isLoading}
                    allStudents={students || []}
                />
            </div>
        </>
    );
}
