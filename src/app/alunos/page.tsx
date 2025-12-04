
"use client";

import { useState } from "react";
import Link from "next/link";
import { collection, doc, writeBatch } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, User, Search, Import } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { removeUndefinedFields } from "@/lib/utils";

export default function AlunosPage() {
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [jsonToImport, setJsonToImport] = useState("");

    const studentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'students');
    }, [firestore]);

    const { data: students, isLoading } = useCollection<Student>(studentsCollection);

    const filteredStudents = (students || []).filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectStudent = (studentId: string) => {
        router.push(`/alunos/${studentId}/editar`);
    };

    const handleImport = async () => {
        if (!firestore) {
            toast({ variant: "destructive", title: "Erro", description: "Conexão com o banco de dados não disponível." });
            return;
        }
        if (!jsonToImport) {
            toast({ variant: "destructive", title: "Erro", description: "A área de texto JSON está vazia." });
            return;
        }

        try {
            const studentsToImport: any[] = JSON.parse(jsonToImport);
            if (!Array.isArray(studentsToImport)) {
                 toast({ variant: "destructive", title: "Erro de Formato", description: "O JSON deve ser uma lista (array) de alunos." });
                return;
            }

            const batch = writeBatch(firestore);
            let importedCount = 0;

            studentsToImport.forEach(item => {
                const studentId = doc(collection(firestore, "students")).id;
                
                // Mapeia e limpa os dados do JSON para o formato Student
                const studentData: Partial<Student> = removeUndefinedFields({
                    id: studentId,
                    name: item["Nome Completo"] || item.name || '',
                    email: item["E-mail"] || item.email || '',
                    phone: item["WhatsApp"] || item.phone || '',
                    cpf: item["CPF"] || item.cpf || '',
                    dob: item["Data de Nascimento"] ? new Date(item["Data de Nascimento"]).toISOString().split('T')[0] : '',
                    startDate: item["Início dos Treinos"] ? new Date(item["Início dos Treinos"]).toISOString().split('T')[0] : '',
                    belt: item["Graduação Atual (Faixa)"] || item.belt || 'Branca',
                    status: 'Ativo', // Define um padrão
                    paymentStatus: 'Pendente', // Define um padrão
                    planType: item["Tipo de Plano"] || item.planType || 'Mensal',
                    planValue: parseFloat(item["Valor do Plano"]) || 200,
                    tshirtSize: item["Camiseta (Tamanho)"] || item.tshirtSize || 'M',
                    pantsSize: item["Calça (Tamanho)"] || item.pantsSize || 'M',
                    emergencyContacts: item["Contato de Emergência"] || item.emergencyContacts || '',
                    medicalHistory: item["Histórico Médico"] || item.medicalHistory || '',
                    generalNotes: item["Observações Gerais"] || item.generalNotes || '',
                    registrationDate: new Date().toISOString(),
                });

                if (studentData.name) {
                    const docRef = doc(firestore, 'students', studentId);
                    batch.set(docRef, studentData);
                    importedCount++;
                }
            });

            await batch.commit();

            toast({
                title: "Importação Concluída!",
                description: `${importedCount} alunos foram importados com sucesso.`,
            });
            setJsonToImport(""); // Limpa o textarea

        } catch (error) {
             console.error("JSON Import Error:", error);
             toast({ variant: "destructive", title: "Erro ao Importar", description: "Verifique o formato do seu JSON ou o console para mais detalhes." });
        }
    };

    return (
        <div className="h-full">
            <Card className="h-full flex flex-col">
                <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                         <div>
                            <CardTitle>Alunos Cadastrados</CardTitle>
                            <CardDescription>Gerencie os alunos da academia</CardDescription>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                 <Button variant="outline">
                                    <Import className="mr-2 h-4 w-4" />
                                    Importar JSON
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Importar Alunos via JSON</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Converta sua planilha para JSON e cole o conteúdo abaixo. Os campos devem corresponder aos nomes da sua planilha original.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="json-import">Conteúdo JSON</Label>
                                    <Textarea 
                                        placeholder="Cole o array de objetos JSON aqui..." 
                                        id="json-import"
                                        className="h-48"
                                        value={jsonToImport}
                                        onChange={(e) => setJsonToImport(e.target.value)}
                                    />
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleImport}>Importar Agora</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
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
                                    Nenhum aluno encontrado.
                                </div>
                             )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
