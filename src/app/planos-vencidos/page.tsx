
"use client";

import { useState, useMemo } from "react";
import { collection, query, where } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Search, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { isBefore, parseISO, format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

function getInitials(name: string) {
    if (!name) return "?";
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

export default function PlanosVencidosPage() {
    const firestore = useFirestore();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");

    const studentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // We only care about active students whose plans might be expired.
        return query(collection(firestore, 'students'), where('status', '==', 'Ativo'));
    }, [firestore]);

    const { data: activeStudents, isLoading } = useCollection<Student>(studentsQuery);

    const expiredStudents = useMemo(() => {
        if (!activeStudents) return [];

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

        let students = activeStudents.filter(student => {
            // A student's plan is considered expired if they don't have an expiration date
            // or if the expiration date is in the past.
            // We exclude students with 100% scholarship as they don't have payment obligations.
            if (student.planType === 'Bolsa 100%') {
                return false;
            }
            if (!student.planExpirationDate) {
                return true; // No expiration date means they are pending payment.
            }
            try {
                const expirationDate = parseISO(student.planExpirationDate);
                return isBefore(expirationDate, today);
            } catch {
                return true; // Treat invalid dates as expired for safety.
            }
        });
        
        if (searchQuery) {
            students = students.filter(student =>
                student.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        return students.sort((a, b) => {
            const dateA = a.planExpirationDate ? parseISO(a.planExpirationDate) : new Date(0);
            const dateB = b.planExpirationDate ? parseISO(b.planExpirationDate) : new Date(0);
            return dateA.getTime() - dateB.getTime();
        });

    }, [activeStudents, searchQuery]);

    const handleSelectStudent = (studentId: string) => {
        router.push(`/alunos/${studentId}/editar`);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-rose-50 border-rose-200 dark:bg-rose-950 dark:border-rose-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-rose-800 dark:text-rose-200">
                            Total de Planos Vencidos
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-900 dark:text-rose-100">
                            {isLoading ? <Skeleton className="h-8 w-12"/> : expiredStudents.length}
                        </div>
                        <p className="text-xs text-muted-foreground">Alunos ativos com mensalidade em atraso.</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                         <div>
                            <CardTitle>Alunos com Planos Vencidos</CardTitle>
                        </div>
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
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[350px]">Aluno</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Tipo de Plano</TableHead>
                                <TableHead>Data de Vencimento</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-6 w-48"/></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20"/></TableCell>
                                    <TableCell><Skeleton className="h-6 w-24"/></TableCell>
                                    <TableCell><Skeleton className="h-6 w-24"/></TableCell>
                                    <TableCell><Skeleton className="h-8 w-32 ml-auto"/></TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && expiredStudents.map((student) => (
                                <TableRow key={student.id} className="cursor-pointer" onClick={() => handleSelectStudent(student.id)}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <span>{student.name}</span>
                                                <div className="text-xs text-muted-foreground">{student.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="destructive">Vencido</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{student.planType || 'Não definido'}</Badge>
                                    </TableCell>
                                     <TableCell>
                                        {student.planExpirationDate 
                                            ? format(parseISO(student.planExpirationDate), 'dd/MM/yyyy') 
                                            : 'Sem data'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/pagamentos/novo/editar?aluno=${student.id}`} passHref>
                                            <Button size="sm" onClick={(e) => e.stopPropagation()}>
                                                Registrar Pagamento
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {!isLoading && expiredStudents.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            Nenhum plano vencido encontrado. Todos os alunos ativos estão em dia!
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

    