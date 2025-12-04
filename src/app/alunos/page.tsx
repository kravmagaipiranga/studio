
"use client";

import { useState } from "react";
import Link from "next/link";
import { collection, query, where, orderBy } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, User, Search, Download } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

type FilterType = 'Ativo' | 'Inativo' | 'Vencido';

const filterDescriptions: Record<FilterType, string> = {
    'Ativo': "Alunos com matrícula ativa.",
    'Inativo': "Alunos que não estão mais ativos.",
    'Vencido': "Alunos com pagamentos vencidos."
};

export default function AlunosPage() {
    const firestore = useFirestore();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<FilterType>('Ativo');

    const studentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        
        let q = query(collection(firestore, 'students'), orderBy('name', 'asc'));

        if (activeFilter === 'Vencido') {
            q = query(q, where('paymentStatus', '==', 'Vencido'));
        } else {
            q = query(q, where('status', '==', activeFilter));
        }

        return q;
    }, [firestore, activeFilter]);

    const { data: students, isLoading } = useCollection<Student>(studentsQuery);

    const filteredStudents = (students || []).filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectStudent = (studentId: string) => {
        router.push(`/alunos/${studentId}/editar`);
    };
    
    // Placeholder for CSV generation
    const handleGenerateReport = () => {
        alert("A funcionalidade de gerar relatório será implementada em breve.");
    };

    return (
        <div className="h-full">
            <Card className="h-full flex flex-col">
                <CardHeader className="border-b">
                    <div className="flex items-start justify-between gap-4">
                         <div>
                            <CardTitle>Alunos - {activeFilter}s</CardTitle>
                            <CardDescription>{filterDescriptions[activeFilter]}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
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
                        <div className="grid grid-cols-3 gap-2">
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
