
"use client";

import { useState, useMemo, useEffect } from "react";
import { collection, query, orderBy } from "firebase/firestore";
import { PaymentsTable } from "@/components/payments/payments-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search, CheckCircle, ClipboardCheck, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Student, Payment } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { parseISO, isAfter, startOfMonth, endOfMonth, isWithinInterval, subMonths, format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FilterType = 'todos' | 'trimestrais' | 'mensais' | 'expirados';

export default function PagamentosPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<FilterType>('todos');
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const paymentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'payments'), orderBy('paymentDate', 'desc'));
    }, [firestore]);

    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsCollection);
    
    const studentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'students');
    }, [firestore]);
    const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsCollection);

    const isLoading = isLoadingPayments || isLoadingStudents;

    // Reset pagination
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeFilter, dateRange]);

    const { 
        paidInMonthCount, 
        activeQuarterlyPlansCount,
    } = useMemo(() => {
        if (!students || !payments) return { paidInMonthCount: 0, activeQuarterlyPlansCount: 0 };
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = format(today, 'yyyy-MM-dd');
        const currentMonthStart = startOfMonth(today);
        const currentMonthEnd = endOfMonth(today);

        const paidThisMonthIds = new Set(
          payments
            ?.filter(p => {
              if (p.planType === 'Matrícula') return false;
              try {
                const paymentDate = parseISO(p.paymentDate);
                return isWithinInterval(paymentDate, { start: currentMonthStart, end: currentMonthEnd });
              } catch {
                return false;
              }
            })
            .map(p => p.studentId)
        );

        // Cálculo baseado em transações trimestrais vigentes (expiração >= hoje)
        const validQuarterlyStudentIds = new Set(
            payments
                .filter(p => 
                    p.planType === 'Trimestral' && 
                    p.expirationDate && 
                    p.expirationDate >= todayStr
                )
                .map(p => p.studentId)
        );
        
        return { 
            paidInMonthCount: paidThisMonthIds.size, 
            activeQuarterlyPlansCount: validQuarterlyStudentIds.size,
        };

    }, [students, payments]);

    const filteredPayments = useMemo(() => {
        if (!payments || !students) return [];
        
        let filtered = payments;

        if (dateRange?.from) {
           const range = {
               start: startOfDay(dateRange.from),
               end: endOfDay(dateRange.to || dateRange.from)
           };
           filtered = filtered.filter(payment => {
               try {
                   const paymentDate = parseISO(payment.paymentDate);
                   return isWithinInterval(paymentDate, range);
               } catch {
                   return false;
               }
           });
        }

        if (activeFilter === 'trimestrais') {
            filtered = filtered.filter(p => p.planType === 'Trimestral');
        } else if (activeFilter === 'mensais') {
            filtered = filtered.filter(p => p.planType === 'Mensal');
        } else if (activeFilter === 'expirados') {
            const today = new Date();
            const prevMonth = subMonths(today, 1);
            const prevMonthStart = startOfMonth(prevMonth);
            const prevMonthEnd = endOfMonth(prevMonth);
            
            const activeStudentIds = new Set(students.filter(s => s.status === 'Ativo').map(s => s.id));

            filtered = payments.filter(p => {
                if (!p.expirationDate || !activeStudentIds.has(p.studentId)) {
                    return false;
                }
                try {
                    const expirationDate = parseISO(p.expirationDate);
                    return isWithinInterval(expirationDate, { start: prevMonthStart, end: prevMonthEnd });
                } catch {
                    return false;
                }
            });
        }

        if(searchQuery) {
            filtered = filtered.filter(payment => 
                payment.studentName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;

    }, [payments, students, searchQuery, activeFilter, dateRange]);

    // Pagination logic
    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
    const paginatedPayments = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredPayments.slice(start, start + itemsPerPage);
    }, [filteredPayments, currentPage, itemsPerPage]);

    const handleExportData = () => {
        if (!filteredPayments || filteredPayments.length === 0) {
            toast({
                variant: "destructive",
                title: "Nenhum dado para exportar",
                description: "A seleção de filtros atual não retornou nenhum registro.",
            });
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

        const paymentRows = filteredPayments.map(p => [
            p.id, p.studentId, p.studentName, p.paymentDate,
            p.planType, p.amount, p.expirationDate, p.paymentMethod, p.notes
        ].map(escapeCSV).join(','));

        const csvContent = [headers.join(','), ...paymentRows].join('\n');
        
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `export_pagamentos_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: "Exportação Concluída!",
            description: `${filteredPayments.length} registros foram exportados com sucesso.`
        });
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
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
                 <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
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
                        <p className="text-xs text-muted-foreground">Baseado em transações trimestrais não expiradas.</p>
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
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                     <div className="relative w-full max-sm:w-full sm:w-auto">
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
                        variant={activeFilter === 'mensais' ? 'default' : 'outline'}
                        onClick={() => setActiveFilter('mensais')}
                     >
                        Planos Mensais
                     </Button>
                     <Button 
                        variant={activeFilter === 'trimestrais' ? 'default' : 'outline'}
                        onClick={() => setActiveFilter('trimestrais')}
                     >
                        Planos Trimestrais
                     </Button>
                     <Button 
                        variant={activeFilter === 'expirados' ? 'destructive' : 'outline'}
                        onClick={() => setActiveFilter('expirados')}
                     >
                        Planos Expirados
                     </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant={activeFilter === 'todos' && !dateRange ? 'default' : 'outline'}
                        onClick={() => {
                            setActiveFilter('todos');
                            setDateRange(undefined);
                        }}
                     >
                        Listar Todos
                    </Button>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                {format(dateRange.from, "LLL dd, y", { locale: ptBR })} -{" "}
                                {format(dateRange.to, "LLL dd, y", { locale: ptBR })}
                                </>
                            ) : (
                                format(dateRange.from, "LLL dd, y", { locale: ptBR })
                            )
                            ) : (
                            <span>Selecione um período</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                            locale={ptBR}
                        />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
             <Card className="flex flex-col shadow-sm">
                <CardContent className="p-0">
                    <PaymentsTable 
                        payments={paginatedPayments}
                        allStudents={students || []}
                        isLoading={isLoading}
                    />
                    
                    {/* Pagination Controls */}
                    {!isLoading && filteredPayments.length > 0 && (
                        <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
                            <div className="text-sm text-muted-foreground">
                                Mostrando <strong>{Math.min(filteredPayments.length, (currentPage - 1) * itemsPerPage + 1)}</strong> a <strong>{Math.min(filteredPayments.length, currentPage * itemsPerPage)}</strong> de <strong>{filteredPayments.length}</strong> registros
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Por página:</span>
                                    <Select 
                                        value={String(itemsPerPage)} 
                                        onValueChange={(val) => {
                                            setItemsPerPage(Number(val));
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="h-8 w-20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="text-xs font-medium px-2">
                                        Página {currentPage} de {totalPages}
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
