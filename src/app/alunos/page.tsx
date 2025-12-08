
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { collection, query, orderBy } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Student, Payment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, User, Search, Download, Upload, AlertCircle, UserCheck, MoreHorizontal, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { BulkImportDialog } from "@/components/students/bulk-import-dialog";
import { Badge } from "@/components/ui/badge";
import { differenceInMonths, isBefore, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type FilterType = 'Todos' | 'Ativo' | 'Inativo' | 'Vencido';

const filterDescriptions: Record<FilterType, string> = {
    'Todos': "Lista completa de todos os alunos cadastrados.",
    'Ativo': "Alunos com matrícula ativa.",
    'Inativo': "Alunos que não estão mais ativos.",
    'Vencido': "Alunos com pagamentos vencidos."
};

const beltStyles: Record<string, string> = {
  'branca': 'bg-white text-black border border-gray-300',
  'amarela': 'bg-yellow-400 text-black',
  'laranja': 'bg-orange-500 text-white',
  'verde': 'bg-green-500 text-white',
  'azul': 'bg-blue-500 text-white',
  'marrom': 'bg-amber-800 text-white',
  'preta': 'bg-black text-white',
};


function calculateTimeSince(dateString: string): string {
    if (!dateString) return "";
    try {
        const startDate = new Date(dateString);
        const now = new Date();
        const totalMonths = differenceInMonths(now, startDate);
        
        if (totalMonths < 0) return ""; // Date is in the future
        if (totalMonths < 1) return "< 1 mês";

        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;

        if (years > 0 && months > 0) {
            return `${years}a ${months}m`;
        } else if (years > 0) {
            return `${years} ${years > 1 ? 'anos' : 'ano'}`;
        } else {
            return `${months} ${months > 1 ? 'meses' : 'mês'}`;
        }
    } catch {
        return "";
    }
}

function getInitials(name: string) {
    if (!name) return "?";
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}


export default function AlunosPage() {
    const firestore = useFirestore();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<FilterType>('Todos');
    
    const studentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'students'), orderBy('name', 'asc'));
    }, [firestore]);
    
    const paymentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'payments');
    }, [firestore]);

    const { data: allStudents, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);
    const { data: allPayments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsQuery);
    
    const isLoading = isLoadingStudents || isLoadingPayments;

    const { activeStudentsCount, newEnrollmentsCount } = useMemo(() => {
        if (!allStudents || !allPayments) return { activeStudentsCount: 0, newEnrollmentsCount: 0 };
    
        const today = new Date();
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
    
        const active = allStudents.filter(s => s.status === 'Ativo').length;
        
        const newEnrollments = allPayments.filter(p => {
            if (p.planType !== 'Matrícula') return false;
            try {
                const paymentDate = parseISO(p.paymentDate);
                return isWithinInterval(paymentDate, { start: monthStart, end: monthEnd });
            } catch {
                return false;
            }
        }).length;
    
        return { activeStudentsCount: active, newEnrollmentsCount: newEnrollments };
    }, [allStudents, allPayments]);

    const studentsWithTimeInBelt = useMemo(() => {
        if (!allStudents) return [];

        return allStudents.map(student => {
            // Prioritize lastExamDate for the calculation.
            // Use startDate as the first fallback, and registrationDate as the final fallback.
            const dateToCalculateFrom = student.lastExamDate || student.startDate || student.registrationDate;
            const timeInBelt = calculateTimeSince(dateToCalculateFrom);
            
            return { ...student, timeInBelt };
        });

    }, [allStudents]);

    const filteredStudents = useMemo(() => {
        if (!studentsWithTimeInBelt) return [];

        let students = studentsWithTimeInBelt;

        if (activeFilter === 'Vencido') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            students = students.filter(student => {
                if (student.status !== 'Ativo') return false;
                if (!student.planExpirationDate) return true;
                try {
                    return isBefore(parseISO(student.planExpirationDate), today);
                } catch { return true; }
            });
        } else if (activeFilter !== 'Todos') {
            students = students.filter(student => student.status === activeFilter);
        }

        if (searchQuery) {
            students = students.filter(student => 
                student.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return students;

    }, [studentsWithTimeInBelt, activeFilter, searchQuery]);
    
    const handleSelectStudent = (studentId: string) => {
        router.push(`/alunos/${studentId}/editar`);
    };

    const handleGenerateReport = () => {
        alert("A funcionalidade de gerar relatório será implementada em breve.");
    };

    const cardTitleSuffix = activeFilter === 'Todos' ? activeFilter : `${activeFilter}s`;

    const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        'Ativo': 'default',
        'Inativo': 'secondary',
        'Pendente': 'destructive'
    }

    return (
        <div className="h-full flex flex-col gap-4">
             <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                            Total de Alunos Ativos
                        </CardTitle>
                        <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                            {isLoading ? <Skeleton className="h-8 w-12"/> : activeStudentsCount}
                        </div>
                    </CardContent>
                </Card>
                 <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Novos Alunos (Mês)
                        </CardTitle>
                        <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                         <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                             {isLoading ? <Skeleton className="h-8 w-12"/> : newEnrollmentsCount}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="h-full flex flex-col flex-grow">
                <CardHeader className="border-b">
                    <div className="flex items-start justify-between gap-4">
                         <div>
                            <CardTitle>Alunos - {cardTitleSuffix}</CardTitle>
                            <CardDescription>{filterDescriptions[activeFilter]}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                            <BulkImportDialog>
                                <Button size="sm" variant="outline">
                                    <Upload className="mr-2 h-4 w-4" />
                                    Importar em Massa
                                </Button>
                            </BulkImportDialog>
                            <Link href="/alunos/novo/editar">
                                <Button size="sm">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Novo Aluno
                                </Button>
                            </Link>
                             <Button variant="outline" size="sm" onClick={handleGenerateReport}>
                                <Download className="mr-2 h-4 w-4" />
                                Gerar Relatório
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-grow flex flex-col">
                     <div className="p-4 space-y-4 border-b">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                             <Button 
                                variant={activeFilter === 'Todos' ? 'default' : 'outline'}
                                onClick={() => setActiveFilter('Todos')}
                             >
                                Listar Todos
                             </Button>
                             <Button 
                                variant={activeFilter === 'Ativo' ? 'default' : 'outline'}
                                onClick={() => setActiveFilter('Ativo')}
                             >
                                Listar Ativos
                             </Button>
                             <Button 
                                variant={activeFilter === 'Inativo' ? 'default' : 'outline'}
                                onClick={() => setActiveFilter('Inativo')}
                             >
                                Listar Inativos
                             </Button>
                             <Button 
                                variant={activeFilter === 'Vencido' ? 'destructive' : 'outline'}
                                onClick={() => setActiveFilter('Vencido')}
                             >
                                Listar Vencidos
                             </Button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar por nome na lista atual..."
                                className="pl-8 w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-grow">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[300px]">Aluno</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Faixa</TableHead>
                                    <TableHead>Tempo na Faixa</TableHead>
                                    <TableHead><span className="sr-only">Ações</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-6 w-48"/></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20"/></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24"/></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20"/></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8"/></TableCell>
                                    </TableRow>
                                ))}
                                {!isLoading && filteredStudents.map((student) => (
                                    <TableRow key={student.id} className="cursor-pointer" onClick={() => handleSelectStudent(student.id)}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div>{student.name}</div>
                                                    <div className="text-xs text-muted-foreground">{student.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariant[student.status] || 'secondary'}>{student.status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                             <Badge className={cn('capitalize', beltStyles[student.belt?.toLowerCase()] || 'bg-gray-400')}>
                                                {student.belt}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {student.timeInBelt && <Badge variant="secondary">{student.timeInBelt}</Badge>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end">
                                                {student.readyForReview && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div onClick={(e) => e.stopPropagation()} className="mr-2">
                                                                    <span>🥋</span>
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Apto para revisão</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleSelectStudent(student.id); }}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         {!isLoading && filteredStudents.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground">
                                Nenhum aluno encontrado para este filtro.
                            </div>
                         )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    