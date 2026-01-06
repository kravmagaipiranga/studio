

"use client";

import { useState, useMemo } from "react";
import { collection, query, orderBy } from "firebase/firestore";
import { PaymentsTable } from "@/components/payments/payments-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search, AlertCircle, CheckCircle, ClipboardCheck } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Student, Payment } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { parseISO, isAfter, isBefore, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";

type FilterType = 'todos' | 'vencidos' | 'trimestrais';

export default function PagamentosPage() {
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<FilterType>('todos');


    const paymentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'payments'), orderBy('paymentDate', 'desc'));
    }, [firestore]);

    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsCollection);
    
    // We still need students to calculate the metrics
    const studentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'students');
    }, [firestore]);
    const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsCollection);

    const isLoading = isLoadingPayments || isLoadingStudents;

    const { 
        paidInMonthCount, 
        overdueCount, 
        activeQuarterlyPlansCount,
        overdueStudentIds,
        activeQuarterlyStudentIds 
    } = useMemo(() => {
        if (!students || !payments) return { paidInMonthCount: 0, overdueCount: 0, activeQuarterlyPlansCount: 0, overdueStudentIds: new Set(), activeQuarterlyStudentIds: new Set() };
        
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today to the start of the day
        const currentMonthStart = startOfMonth(today);
        const currentMonthEnd = endOfMonth(today);

        const paidThisMonthIds = new Set(
          payments
            ?.filter(p => {
              if (p.planType === 'Matrícula') return false; // Don't count enrollment as a plan payment
              try {
                const paymentDate = parseISO(p.paymentDate);
                return isWithinInterval(paymentDate, { start: currentMonthStart, end: currentMonthEnd });
              } catch {
                return false;
              }
            })
            .map(p => p.studentId)
        );

        const overdueStudents = students.filter(s => {
            if (s.status !== 'Ativo' || !s.planExpirationDate) {
                return false;
            }
            try {
                const expirationDate = parseISO(s.planExpirationDate);
                return isBefore(expirationDate, today);
            } catch {
                return false;
            }
        });


        const activeQuarterlyStudents = students.filter(student => {
            if (student.status !== 'Ativo' || student.planType !== 'Trimestral' || !student.planExpirationDate) {
                return false;
            }
            try {
                const expirationDate = parseISO(student.planExpirationDate);
                return isAfter(expirationDate, today);
            } catch {
                return false;
            }
        });
        
        return { 
            paidInMonthCount: paidThisMonthIds.size, 
            overdueCount: overdueStudents.length, 
            activeQuarterlyPlansCount: activeQuarterlyStudents.length,
            overdueStudentIds: new Set(overdueStudents.map(s => s.id)),
            activeQuarterlyStudentIds: new Set(activeQuarterlyStudents.map(s => s.id))
        };

    }, [students, payments]);

    const filteredPayments = useMemo(() => {
        if (!payments) return [];
        
        let filtered = payments;

        if (activeFilter === 'vencidos') {
            filtered = payments.filter(p => overdueStudentIds.has(p.studentId));
        } else if (activeFilter === 'trimestrais') {
            filtered = payments.filter(p => activeQuarterlyStudentIds.has(p.studentId));
        }

        if(searchQuery) {
            return filtered.filter(payment => 
                payment.studentName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;

    }, [payments, searchQuery, activeFilter, overdueStudentIds, activeQuarterlyStudentIds]);

    const handleExportData = () => {
        if (!payments) {
            alert("Os dados de pagamentos ainda não foram carregados.");
            return;
        }

        const headers = [
            "ID Pagamento", "ID Aluno", "Nome do Aluno", "Data Pagamento", 
            "Tipo de Plano", "Valor", "Data de Expiração", "Método de Pagamento", "Observações"
        ];
        
        const escapeCSV = (str: any) => {
            if (str === null || str === undefined) return '';
            const toStr = String(str);
            if (toStr.includes(',') || toStr.includes('"') || toStr.includes('\n')) {
                return `"${toStr.replace(/"/g, '""')}"`;
            }
            return toStr;
        };

        const paymentRows = payments.map(p => [
            p.id, p.studentId, p.studentName, p.paymentDate,
            p.planType, p.amount, p.expirationDate, p.paymentMethod, p.notes
        ].map(escapeCSV).join(','));

        const csvContent = [headers.join(','), ...paymentRows].join('\n');
        
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'export_pagamentos.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <>
            <div className="grid gap-4 md:grid-cols-3 mb-4">
                <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                            Pagantes no Mês
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                            {isLoading ? <Skeleton className="h-8 w-12"/> : paidInMonthCount}
                        </div>
                        <p className="text-xs text-muted-foreground">Alunos com planos pagos no mês corrente.</p>
                    </CardContent>
                </Card>
                 <Card 
                     onClick={() => setActiveFilter('vencidos')}
                     className={cn(
                         "cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1",
                         activeFilter === 'vencidos' ? "ring-2 ring-destructive" : "",
                         "bg-rose-50 border-rose-200 dark:bg-rose-950 dark:border-rose-800"
                     )}
                 >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-rose-800 dark:text-rose-200">Alunos Vencidos</CardTitle>
                        <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    </CardHeader>
                    <CardContent>
                         <div className="text-2xl font-bold text-rose-900 dark:text-rose-100">
                             {isLoading ? <Skeleton className="h-8 w-12"/> : overdueCount}
                        </div>
                         <p className="text-xs text-muted-foreground">Planos que expiraram e não foram renovados.</p>
                    </CardContent>
                </Card>
                 <Card 
                     onClick={() => setActiveFilter('trimestrais')}
                     className={cn(
                         "cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1",
                         activeFilter === 'trimestrais' ? "ring-2 ring-blue-500" : "",
                         "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                     )}
                 >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Planos Trimestrais Vigentes
                        </CardTitle>
                        <ClipboardCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                         <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                             {isLoading ? <Skeleton className="h-8 w-12"/> : activeQuarterlyPlansCount}
                        </div>
                        <p className="text-xs text-muted-foreground">Alunos com plano trimestral ativo.</p>
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
                    <Button variant="outline" onClick={handleExportData}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar Dados
                    </Button>
                </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                     <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar por nome do aluno..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                     <Button 
                        variant={activeFilter === 'todos' ? 'default' : 'outline'}
                        onClick={() => setActiveFilter('todos')}
                     >
                        Listar Todos
                     </Button>
                     <Button
                        variant={activeFilter === 'vencidos' ? 'destructive' : 'outline'}
                        onClick={() => setActiveFilter('vencidos')}
                     >
                        <AlertCircle className="mr-2 h-4 w-4"/>
                        Planos Vencidos
                     </Button>
                </div>
                <DatePickerWithRange />
            </div>
             <div className="flex flex-1 rounded-lg shadow-sm mt-4">
                <PaymentsTable 
                    payments={filteredPayments}
                    isLoading={isLoading}
                />
            </div>
        </>
    );
}
