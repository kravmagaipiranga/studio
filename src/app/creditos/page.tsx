
"use client";

import { useState, useEffect } from "react";
import { collection, doc, updateDoc } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Save } from "lucide-react";

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
        <div className="flex flex-col gap-4">
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
                            <Skeleton className="h-10 w-1/4 self-end" />
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
        </div>
    );
}
