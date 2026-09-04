
"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { collection, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Download, Upload, UserCheck, MoreHorizontal, UserPlus, UserX, GraduationCap, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { BulkImportDialog } from "@/components/students/bulk-import-dialog";
import { Badge } from "@/components/ui/badge";
import { differenceInMonths, isBefore, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StudentsByBeltChart } from "@/components/students/students-by-belt-chart";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


type FilterType = 'Todos' | 'Ativo' | 'Inativo' | 'Vencido' | 'Aptos para Revisão' | 'Branca' | 'Amarela' | 'Laranja' | 'Verde' | 'Azul' | 'Marrom' | 'Preta';

const filterDescriptions: Record<FilterType, string> = {
    'Todos': "Lista completa de todos os alunos cadastrados.",
    'Ativo': "Alunos com matrícula ativa.",
    'Inativo': "Alunos que não estão mais ativos.",
    'Vencido': "Alunos com pagamentos vencidos.",
    'Aptos para Revisão': "Alunos que cumprem os requisitos de tempo para a próxima graduação.",
    'Branca': "Alunos ativos na faixa Branca.",
    'Amarela': "Alunos ativos na faixa Amarela.",
    'Laranja': "Alunos ativos na faixa Laranja.",
    'Verde': "Alunos ativos na faixa Verde.",
    'Azul': "Alunos ativos na faixa Azul.",
    'Marrom': "Alunos ativos na faixa Marrom.",
    'Preta': "Alunos ativos na faixa Preta.",
};

const beltOrder: (keyof typeof beltStyles)[] = ['branca', 'amarela', 'laranja', 'verde', 'azul', 'marrom', 'preta'];

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
        
        if (totalMonths < 0) return ""; 
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

function AlunosContent() {
    const firestore = useFirestore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<FilterType>('Todos');
    const [activeTab, setActiveTab] = useState<'Ativo' | 'Inativo'>('Ativo');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    // Persist tab in sessionStorage so navigating to edit and back keeps it
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem('alunos-tab') as 'Ativo' | 'Inativo' | null;
            if (saved === 'Ativo' || saved === 'Inativo') setActiveTab(saved);
        } catch { /* ignore */ }
    }, []);

    const handleTabChange = (tab: 'Ativo' | 'Inativo') => {
        setActiveTab(tab);
        setCurrentPage(1);
        setActiveFilter('Todos');
        try { sessionStorage.setItem('alunos-tab', tab); } catch { /* ignore */ }
    };

    useEffect(() => {
        const filterParam = searchParams.get('filter');
        if (filterParam === 'aptos') {
            setActiveFilter('Aptos para Revisão');
        }
        
        const searchParam = searchParams.get('search');
        if (searchParam) {
            setSearchQuery(searchParam);
        }
    }, [searchParams]);
    
    const studentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'students'), orderBy('name', 'asc'));
    }, [firestore]);
    
    const { data: allStudents, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);
    
    const isLoading = isLoadingStudents;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeFilter]);

    const { activeStudentsCount, newEnrollmentsCount } = useMemo(() => {
        if (!allStudents) return { activeStudentsCount: 0, newEnrollmentsCount: 0 };
    
        const today = new Date();
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
    
        const active = allStudents.filter(s => s.status === 'Ativo').length;
        
        const newEnrollments = allStudents.filter(student => {
            if (!student.activationDate) return false;
            try {
                const activationDate = parseISO(student.activationDate);
                return isWithinInterval(activationDate, { start: monthStart, end: monthEnd });
            } catch {
                return false;
            }
        }).length;
    
        return { activeStudentsCount: active, newEnrollmentsCount: newEnrollments };
    }, [allStudents]);

    const studentsWithTimeInBelt = useMemo(() => {
        if (!allStudents) return [];

        return allStudents.map(student => {
            const dateToCalculateFrom = student.lastExamDate || student.startDate || student.registrationDate;
            const timeInBelt = calculateTimeSince(dateToCalculateFrom);
            
            return { ...student, timeInBelt };
        });

    }, [allStudents]);

    const filteredStudents = useMemo(() => {
        if (!studentsWithTimeInBelt) return [];

        // 1. Always filter by the active tab first
        let students = studentsWithTimeInBelt.filter(s => s.status === activeTab);

        // 2. Apply secondary filter within the tab
        if (activeFilter === 'Vencido') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            students = students.filter(student => {
                if (!student.planExpirationDate) return false;
                try {
                    return isBefore(parseISO(student.planExpirationDate), today);
                } catch { 
                    return false; 
                }
            });
        } else if (activeFilter === 'Aptos para Revisão') {
            const now = new Date();
            students = students.filter(student => {
                if (!student.belt) return false;
                const belt = student.belt.toLowerCase();
                try {
                    if (belt === 'branca') {
                        const startDate = student.startDate ? parseISO(student.startDate) : (student.registrationDate ? parseISO(student.registrationDate) : null);
                        return startDate ? differenceInMonths(now, startDate) >= 4 : false;
                    }
                    if (!student.lastExamDate) return false;
                    const lastExamDate = parseISO(student.lastExamDate);
                    const monthsSinceExam = differenceInMonths(now, lastExamDate);
                    if (belt === 'amarela') return monthsSinceExam >= 12;
                    if (belt === 'laranja') return monthsSinceExam >= 18; 
                    if (belt === 'verde' || belt === 'azul') return monthsSinceExam >= 24; 
                    if (belt === 'marrom') return monthsSinceExam >= 36; 
                } catch {
                    return false;
                }
                return false;
            });
        } else if (beltOrder.includes(activeFilter.toLowerCase())) {
            students = students.filter(student => student.belt?.toLowerCase() === activeFilter.toLowerCase());
        }

        // 3. Search
        if (searchQuery) {
            students = students.filter(student => 
                student.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return students;

    }, [studentsWithTimeInBelt, activeFilter, activeTab, searchQuery]);

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredStudents.slice(start, start + itemsPerPage);
    }, [filteredStudents, currentPage, itemsPerPage]);
    
    const handleToggleStatus = async (e: React.MouseEvent, student: Student) => {
        e.stopPropagation();
        if (!firestore || togglingId === student.id) return;
        const newStatus = student.status === 'Ativo' ? 'Inativo' : 'Ativo';
        const activationDate = student.status === 'Pendente' && newStatus === 'Ativo'
            ? new Date().toISOString()
            : undefined;
        setTogglingId(student.id);
        try {
            await updateDoc(doc(firestore, 'students', student.id), {
                status: newStatus,
                ...(activationDate ? { activationDate } : {}),
            });
            toast({
                title: newStatus === 'Ativo' ? "Aluno ativado" : "Aluno inativado",
                description: `${student.name} foi marcado como ${newStatus}.`,
            });
        } catch {
            toast({
                variant: "destructive",
                title: "Erro ao atualizar status",
                description: "Não foi possível alterar o status do aluno. Tente novamente.",
            });
        } finally {
            setTogglingId(null);
        }
    };

    const handleSelectStudent = (studentId: string) => {
        router.push(`/alunos/${studentId}/editar`);
    };

    const handleExportData = () => {
        if (!filteredStudents || filteredStudents.length === 0) {
            toast({
                variant: "destructive",
                title: "Nenhum aluno para exportar",
                description: "O filtro atual não retornou nenhum aluno.",
            });
            return;
        }

        const headers = [
            "ID", "Nome", "Email", "Data de Cadastro", "Status", 
            "Status Pagamento", "Data de Vencimento", "Data de Nascimento", "CPF",
            "Tam. Camiseta", "Tam. Calça", "Telefone", "Contatos de Emergência",
            "Data de Início", "Último Exame", "Faixa", "Apto para Revisão", 
            "Histórico Médico", "Anotações Gerais", "Anuidade FIKM Paga", 
            "Data Pgto. Anuidade", "Método Pgto. Anuidade", "Tipo de Plano",
            "Valor do Plano", "Último Pagamento", "Validade do Plano"
        ];
        
        const escapeCSV = (str: any) => {
            if (str === null || str === undefined) return '';
            const toStr = String(str);
            if (toStr.includes(',') || toStr.includes('"') || toStr.includes('\n')) {
                return `"${toStr.replace(/"/g, '""')}"`;
            }
            return toStr;
        };

        const studentRows = filteredStudents.map(s => [
            s.id, s.name, s.email, s.registrationDate, s.status,
            s.paymentStatus, s.dueDate, s.dob, s.cpf,
            s.tshirtSize, s.pantsSize, s.phone, s.emergencyContacts,
            s.startDate, s.lastExamDate, s.belt, s.readyForReview,
            s.medicalHistory, s.generalNotes, s.fikmAnnuityPaid,
            s.fikmAnnuityPaymentDate, s.fikmAnnuityPaymentMethod, s.planType,
            s.planValue, s.lastPaymentDate, s.planExpirationDate
        ].map(escapeCSV).join(','));

        const csvContent = [headers.join(','), ...studentRows].join('\n');
        
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'export_alunos.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: "Exportação Concluída",
            description: `${filteredStudents.length} alunos foram exportados.`,
        });
    };

    const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        'Ativo': 'default',
        'Inativo': 'secondary',
        'Pendente': 'destructive',
        'Particular': 'outline',
    }
    
    // 'Ativo' and 'Inativo' removed — handled by tabs
    const generalFilters: FilterType[] = ['Todos', 'Vencido'];
    const beltFilters: FilterType[] = ['Branca', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Marrom', 'Preta'];

    const activeCount = studentsWithTimeInBelt.filter(s => s.status === 'Ativo').length;
    const inactiveCount = studentsWithTimeInBelt.filter(s => s.status === 'Inativo').length;


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

            <div className="grid gap-4">
                 <StudentsByBeltChart students={allStudents || []} isLoading={isLoadingStudents} />
            </div>

            <Card className="h-full flex flex-col flex-grow">
                {/* ── Browser-style tabs ─────────────────────────────────── */}
                <div className="flex items-end justify-between px-6 pt-5 border-b bg-muted/20">
                    <div className="flex items-end gap-1">
                        <button
                            onClick={() => handleTabChange('Ativo')}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-t-lg border border-b-0 transition-all select-none",
                                activeTab === 'Ativo'
                                    ? "bg-white border-border text-foreground shadow-sm -mb-px z-10"
                                    : "bg-muted/40 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            )}
                        >
                            <UserCheck className="h-4 w-4 text-emerald-500" />
                            Ativos
                            {!isLoading && (
                                <span className={cn(
                                    "ml-1 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold",
                                    activeTab === 'Ativo' ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                                )}>
                                    {activeCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => handleTabChange('Inativo')}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-t-lg border border-b-0 transition-all select-none",
                                activeTab === 'Inativo'
                                    ? "bg-white border-border text-foreground shadow-sm -mb-px z-10"
                                    : "bg-muted/40 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            )}
                        >
                            <UserX className="h-4 w-4 text-slate-400" />
                            Inativos
                            {!isLoading && (
                                <span className={cn(
                                    "ml-1 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold",
                                    activeTab === 'Inativo' ? "bg-slate-100 text-slate-600" : "bg-muted text-muted-foreground"
                                )}>
                                    {inactiveCount}
                                </span>
                            )}
                        </button>
                    </div>
                    <div className="flex items-center gap-2 pb-2 flex-wrap justify-end">
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
                        <Button variant="outline" size="sm" onClick={handleExportData}>
                            <Download className="mr-2 h-4 w-4" />
                            Exportar Dados
                        </Button>
                    </div>
                </div>
                <CardContent className="p-0 flex-grow flex flex-col">
                    <div className="p-4 space-y-4 border-b">
                        <div className="flex flex-wrap items-center gap-2">
                            {activeTab === 'Ativo' && (
                              <>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant={activeFilter === 'Vencido' ? 'default' : 'outline'} size="sm">
                                            Filtro: {activeFilter}
                                            <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        {generalFilters.map(filter => (
                                            <DropdownMenuItem key={filter} onSelect={() => setActiveFilter(filter)}>
                                                {filter === 'Todos' ? 'Todos os ativos' : filter}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant={beltFilters.includes(activeFilter) ? 'default' : 'outline'} size="sm">
                                            Faixa: {beltFilters.includes(activeFilter) ? activeFilter : 'Selecione'}
                                            <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuItem onSelect={() => setActiveFilter('Todos')}>
                                            Todas as faixas
                                        </DropdownMenuItem>
                                        {beltFilters.map(belt => (
                                            <DropdownMenuItem key={belt} onSelect={() => setActiveFilter(belt)}>
                                                <div className="flex items-center">
                                                    <span className={cn("w-3 h-3 rounded-full mr-2", beltStyles[belt.toLowerCase()])}></span>
                                                    {belt}
                                                </div>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Button 
                                    variant={activeFilter === 'Aptos para Revisão' ? 'default' : 'outline'}
                                    onClick={() => setActiveFilter('Aptos para Revisão')}
                                    size="sm"
                                    className={cn(activeFilter === 'Aptos para Revisão' && "bg-blue-600 text-white hover:bg-blue-700")}
                                >
                                    <GraduationCap className="mr-2 h-4 w-4" />
                                    Aptos para Revisão
                                </Button>
                              </>
                            )}
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
                                {!isLoading && paginatedStudents.map((student) => (
                                    <TableRow key={student.id} className="cursor-pointer" onClick={() => handleSelectStudent(student.id)}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span>{student.name}</span>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    {student.userId ? (
                                                                        <UserCheck className="h-4 w-4 text-green-500" />
                                                                    ) : (
                                                                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                                                                    )}
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{student.userId ? "Perfil de login vinculado" : "Nenhum login vinculado"}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
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
                                            <div className="flex items-center justify-end gap-1">
                                                {student.readyForReview && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div onClick={(e) => e.stopPropagation()} className="mr-1">
                                                                    <span>🥋</span>
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Apto para revisão</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                disabled={togglingId === student.id}
                                                                onClick={(e) => handleToggleStatus(e, student)}
                                                                className={cn(
                                                                    student.status === 'Ativo'
                                                                        ? "text-green-600 hover:text-red-600 hover:bg-red-50"
                                                                        : "text-muted-foreground hover:text-green-600 hover:bg-green-50"
                                                                )}
                                                            >
                                                                {student.status === 'Ativo'
                                                                    ? <UserCheck className="h-4 w-4" />
                                                                    : <UserX className="h-4 w-4" />
                                                                }
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{student.status === 'Ativo' ? 'Inativar aluno' : 'Ativar aluno'}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
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
                    
                    {/* Pagination Controls */}
                    {!isLoading && filteredStudents.length > 0 && (
                        <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
                            <div className="text-sm text-muted-foreground">
                                Mostrando <strong>{Math.min(filteredStudents.length, (currentPage - 1) * itemsPerPage + 1)}</strong> a <strong>{Math.min(filteredStudents.length, currentPage * itemsPerPage)}</strong> de <strong>{filteredStudents.length}</strong> alunos
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

export default function AlunosPage() {
  return (
    <Suspense fallback={<Skeleton className="h-screen w-full" />}>
      <AlunosContent />
    </Suspense>
  );
}
