
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { collection, query, orderBy } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, User, Search, Download, Upload, AlertCircle, UserCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { BulkImportDialog } from "@/components/students/bulk-import-dialog";

type FilterType = 'Todos' | 'Ativo' | 'Inativo' | 'Vencido';

const filterDescriptions: Record<FilterType, string> = {
    'Todos': "Lista completa de todos os alunos cadastrados.",
    'Ativo': "Alunos com matrícula ativa.",
    'Inativo': "Alunos que não estão mais ativos.",
    'Vencido': "Alunos com pagamentos vencidos."
};

const beltEmojis: Record<string, string> = {
    'Branca': '⚪',
    'Amarela': '🟡',
    'Laranja': '🟠',
    'Verde': '🟢',
    'Azul': '🔵',
    'Marrom': '🟤',
    'Preta': '⚫',
};

const statusEmojis: Record<string, string> = {
    'Ativo': '✅',
    'Inativo': '⛔',
    'Pendente': '⚠'
};


export default function AlunosPage() {
    const firestore = useFirestore();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<FilterType>('Todos');
    
    const studentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'students'), orderBy('name', 'asc'));
    }, [firestore]);

    const { data: allStudents, isLoading } = useCollection<Student>(studentsQuery);

    const { activeStudentsCount, overdueStudentsCount } = useMemo(() => {
        if (!allStudents) return { activeStudentsCount: 0, overdueStudentsCount: 0 };
        const active = allStudents.filter(s => s.status === 'Ativo').length;
        const overdue = allStudents.filter(s => s.paymentStatus === 'Vencido').length;
        return { activeStudentsCount: active, overdueStudentsCount: overdue };
    }, [allStudents]);

    const filteredStudents = useMemo(() => {
        if (!allStudents) return [];

        let students = allStudents;

        if (activeFilter === 'Vencido') {
            students = students.filter(student => student.paymentStatus === 'Vencido');
        } else if (activeFilter !== 'Todos') {
            students = students.filter(student => student.status === activeFilter);
        }

        if (searchQuery) {
            students = students.filter(student => 
                student.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return students;

    }, [allStudents, activeFilter, searchQuery]);
    
    const handleSelectStudent = (studentId: string) => {
        router.push(`/alunos/${studentId}/editar`);
    };

    const handleGenerateReport = () => {
        alert("A funcionalidade de gerar relatório será implementada em breve.");
    };

    const cardTitleSuffix = activeFilter === 'Todos' ? activeFilter : `${activeFilter}s`;

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
                 <Card className="bg-rose-50 border-rose-200 dark:bg-rose-950 dark:border-rose-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-rose-800 dark:text-rose-200">
                            Planos Vencidos
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    </CardHeader>
                    <CardContent>
                         <div className="text-2xl font-bold text-rose-900 dark:text-rose-100">
                             {isLoading ? <Skeleton className="h-8 w-12"/> : overdueStudentsCount}
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

                    <ScrollArea className="flex-grow">
                        <div className="p-2 space-y-1">
                            {isLoading && Array.from({ length: 10 }).map((_, index) => (
                                <Skeleton key={index} className="h-10 w-full" />
                            ))}
                            {!isLoading && filteredStudents.map((student) => (
                                <button
                                    key={student.id}
                                    onClick={() => handleSelectStudent(student.id)}
                                    className={cn(
                                        "w-full text-left flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                        "hover:bg-muted"
                                    )}
                                >
                                    <User className="h-4 w-4" />
                                    <span>{statusEmojis[student.status] || '❔'}</span>
                                    <span>{beltEmojis[student.belt] || '❔'}</span>
                                    {student.name}
                                </button>
                            ))}
                             {!isLoading && filteredStudents.length === 0 && (
                                <div className="text-center py-10 text-muted-foreground">
                                    Nenhum aluno encontrado para este filtro.
                                </div>
                             )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
