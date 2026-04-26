
"use client";

import { useState, useMemo, useEffect } from "react";
import { ExamsTable } from "@/components/exams/exams-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Exam, Student } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";

const beltOrder: Record<string, number> = {
    'Amarela': 1,
    'Laranja': 2,
    'Verde': 3,
    'Azul': 4,
    'Marrom': 5,
    'Preta': 6,
};

const beltInfo: Record<string, { emoji: string; colorClass: string }> = {
    'Amarela': { emoji: '🟡', colorClass: 'bg-yellow-400 hover:bg-yellow-400 text-black' },
    'Laranja': { emoji: '🟠', colorClass: 'bg-orange-500 hover:bg-orange-500 text-white' },
    'Verde':   { emoji: '🟢', colorClass: 'bg-green-500 hover:bg-green-500 text-white' },
    'Azul':    { emoji: '🔵', colorClass: 'bg-blue-500 hover:bg-blue-500 text-white' },
    'Marrom':  { emoji: '🟤', colorClass: 'bg-amber-800 hover:bg-amber-800 text-white' },
    'Preta':   { emoji: '⚫', colorClass: 'bg-gray-800 hover:bg-gray-800 text-white' },
};

export default function ExamesPage() {
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState("");
    const [exams, setExams] = useState<Exam[]>([]);
    const [beltFilter, setBeltFilter] = useState<string>("all");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    
    const examsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'exams');
    }, [firestore]);

    const studentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'students');
    }, [firestore]);

    const { data: initialExams, isLoading: isLoadingExams } = useCollection<Exam>(examsCollection);
    const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsCollection);

    useEffect(() => {
        if (initialExams) {
            setExams(initialExams);
        }
    }, [initialExams]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, beltFilter, dateRange]);

    const examCountsByBelt = useMemo(() => {
        const counts: Record<string, number> = {};
        if (!exams) return counts;

        for (const belt of Object.keys(beltInfo)) {
            counts[belt] = 0;
        }

        exams.forEach(exam => {
            if (exam.targetBelt && counts.hasOwnProperty(exam.targetBelt)) {
                counts[exam.targetBelt]++;
            }
        });
        return counts;
    }, [exams]);

    const filteredAndSortedExams = useMemo(() => {
        if (!exams) return [];

        const fromTime = dateRange?.from ? new Date(dateRange.from).setHours(0, 0, 0, 0) : null;
        const toTime = dateRange?.to ? new Date(dateRange.to).setHours(23, 59, 59, 999) : null;

        let filtered = exams.filter(exam => {
            // Name search
            if (searchQuery && !exam.studentName.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            // Belt filter
            if (beltFilter !== "all" && exam.targetBelt !== beltFilter) {
                return false;
            }
            // Date range filter
            if (fromTime !== null || toTime !== null) {
                if (!exam.examDate) return false;
                const examTime = new Date(exam.examDate).getTime();
                if (isNaN(examTime)) return false;
                if (fromTime !== null && examTime < fromTime) return false;
                if (toTime !== null && examTime > toTime) return false;
            }
            return true;
        });

        return filtered.sort((a, b) => {
            // 1. Date (most recent first)
            const dateA = a.examDate ? new Date(a.examDate).getTime() : 0;
            const dateB = b.examDate ? new Date(b.examDate).getTime() : 0;
            if (dateA !== dateB) {
                return dateB - dateA;
            }
            // 2. Graduation/belt order
            const orderA = beltOrder[a.targetBelt] || 99;
            const orderB = beltOrder[b.targetBelt] || 99;
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            // 3. Tiebreaker by student name
            return a.studentName.localeCompare(b.studentName);
        });

    }, [exams, searchQuery, beltFilter, dateRange]);

    const hasActiveFilters = searchQuery !== "" || beltFilter !== "all" || dateRange?.from !== undefined || dateRange?.to !== undefined;

    const clearFilters = () => {
        setSearchQuery("");
        setBeltFilter("all");
        setDateRange(undefined);
    };

    // Pagination logic
    const totalPages = Math.ceil(filteredAndSortedExams.length / itemsPerPage);
    const paginatedExams = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedExams.slice(start, start + itemsPerPage);
    }, [filteredAndSortedExams, currentPage, itemsPerPage]);

    const handleAddNewExam = () => {
       const newExam: Exam = {
         id: `new_${uuidv4()}`,
         studentId: "",
         studentName: "",
         studentCpf: "",
         studentAge: 0,
         examDate: new Date().toISOString().split('T')[0],
         targetBelt: "",
         paymentStatus: "Pendente",
         paymentDate: "",
         paymentAmount: 200,
         paymentMethod: "Pendente",
         isNew: true,
       };
       setExams(prevExams => [newExam, ...prevExams]);
    };
    
    const isLoading = isLoadingExams || isLoadingStudents;

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Inscritos por Faixa</h3>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(beltInfo).map(([belt, { emoji, colorClass }]) => (
                        <Badge key={belt} className={cn("text-base", colorClass)}>
                            {isLoading ? <Skeleton className="h-5 w-5 bg-white/30 rounded-full" /> : 
                            <span className="font-bold mr-2">{examCountsByBelt[belt] ?? 0}</span>}
                             {belt}
                        </Badge>
                    ))}
                </div>
            </div>
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Inscrições de Exame</h1>
                <div className="flex items-center gap-2">
                    <Button onClick={handleAddNewExam}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agendar Exame
                    </Button>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Gerar Relatório
                    </Button>
                </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por nome de aluno..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={beltFilter} onValueChange={setBeltFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filtrar por graduação" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as graduações</SelectItem>
                            {Object.entries(beltInfo).map(([belt, { emoji }]) => (
                                <SelectItem key={belt} value={belt}>
                                    <span className="mr-2">{emoji}</span>{belt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <DatePickerWithRange
                        value={dateRange}
                        onChange={setDateRange}
                        placeholder="Filtrar por data do exame"
                    />
                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            <X className="mr-1 h-4 w-4" />
                            Limpar filtros
                        </Button>
                    )}
                </div>
            </div>
            <Card className="flex flex-col shadow-sm">
                <CardContent className="p-0">
                    <ExamsTable 
                        exams={paginatedExams}
                        setExams={setExams}
                        allStudents={students || []}
                        isLoading={isLoading}
                    />
                    
                    {!isLoading && filteredAndSortedExams.length > 0 && (
                        <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
                            <div className="text-sm text-muted-foreground">
                                Mostrando <strong>{Math.min(filteredAndSortedExams.length, (currentPage - 1) * itemsPerPage + 1)}</strong> a <strong>{Math.min(filteredAndSortedExams.length, currentPage * itemsPerPage)}</strong> de <strong>{filteredAndSortedExams.length}</strong> exames
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
