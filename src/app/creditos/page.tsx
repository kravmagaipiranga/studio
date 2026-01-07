
"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, doc, updateDoc } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, WalletCards } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function getInitials(name: string) {
    if (!name) return "?";
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

export default function CreditosPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [creditValue, setCreditValue] = useState<string>("");
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const studentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'students');
    }, [firestore]);

    const { data: students, isLoading } = useCollection<Student>(studentsCollection);

    const studentOptions = (students || []).slice().sort((a,b) => a.name.localeCompare(b.name)).map(s => ({ value: s.id, label: s.name }));

    const studentsWithCredits = useMemo(() => {
        if (!students) return [];
        return students
            .filter(s => s.paymentCredits && parseFloat(s.paymentCredits) > 0)
            .sort((a, b) => parseFloat(b.paymentCredits!) - parseFloat(a.paymentCredits!));
    }, [students]);

    useEffect(() => {
        if (selectedStudentId) {
            const student = students?.find(s => s.id === selectedStudentId);
            setCreditValue(student?.paymentCredits || "0");
        } else {
            setCreditValue("");
        }
    }, [selectedStudentId, students]);

    const handleSaveCredit = async () => {
        if (!firestore || !selectedStudentId) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Nenhum aluno selecionado."
            });
            return;
        }

        setIsSaving(true);
        const studentDocRef = doc(firestore, 'students', selectedStudentId);

        try {
            await updateDoc(studentDocRef, {
                paymentCredits: creditValue
            });
            toast({
                title: "Crédito Salvo!",
                description: `O crédito do aluno foi atualizado para R$ ${creditValue}.`
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao Salvar",
                description: "Não foi possível atualizar o crédito. Tente novamente."
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Gestão de Créditos</h1>
            </div>
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Adicionar ou Editar Crédito</CardTitle>
                    <CardDescription>
                        Selecione um aluno para visualizar ou modificar o valor de crédito disponível.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-32 ml-auto" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Aluno</label>
                                <Combobox
                                    options={studentOptions}
                                    value={selectedStudentId}
                                    onChange={setSelectedStudentId}
                                    placeholder="Selecione um aluno..."
                                    searchPlaceholder="Buscar aluno..."
                                    notFoundText="Nenhum aluno encontrado."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Valor do Crédito (R$)</label>
                                <Input
                                    type="text"
                                    placeholder="0.00"
                                    value={creditValue}
                                    onChange={(e) => setCreditValue(e.target.value)}
                                    disabled={!selectedStudentId}
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={handleSaveCredit}
                                    disabled={!selectedStudentId || isSaving}
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    {isSaving ? "Salvando..." : "Salvar Crédito"}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                        <WalletCards className="h-5 w-5 text-muted-foreground" />
                        Alunos com Crédito
                    </CardTitle>
                    <CardDescription>
                        Lista de todos os alunos que possuem algum saldo de crédito.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Aluno</TableHead>
                                    <TableHead className="text-right">Valor do Crédito</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studentsWithCredits.length > 0 ? (
                                    studentsWithCredits.map(student => (
                                        <TableRow key={student.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{student.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                R$ {parseFloat(student.paymentCredits!).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center h-24 text-muted-foreground">
                                            Nenhum aluno com crédito encontrado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
