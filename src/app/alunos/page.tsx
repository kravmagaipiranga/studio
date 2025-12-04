
"use client";

import { useState } from "react";
import Link from "next/link";
import { collection, query, orderBy } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, User, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";


export default function AlunosPage() {
    const firestore = useFirestore();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");

    const studentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'students'), 
            orderBy('name', 'asc')
        );
    }, [firestore]);

    const { data: students, isLoading } = useCollection<Student>(studentsQuery);

    const filteredStudents = (students || []).filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectStudent = (studentId: string) => {
        router.push(`/alunos/${studentId}/editar`);
    };

    return (
        <div className="h-full">
            <Card className="h-full flex flex-col">
                <CardHeader className="border-b">
                    <div className="flex items-center justify-between gap-4">
                         <div>
                            <CardTitle>Alunos Cadastrados</CardTitle>
                            <CardDescription>Gerencie os alunos da academia</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-grow flex flex-col">
                     <div className="p-4 space-y-2 border-b">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar por nome..."
                                className="pl-8 w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Link href="/alunos/novo/editar" className="w-full">
                            <Button className="w-full">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Adicionar Novo Aluno
                            </Button>
                        </Link>
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
                                    Nenhum aluno cadastrado.
                                </div>
                             )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
