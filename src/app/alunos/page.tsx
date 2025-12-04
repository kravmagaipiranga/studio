"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { collection, query, orderBy } from "firebase/firestore";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { setDoc, writeBatch } from "firebase/firestore";

type FilterType = 'Ativo' | 'Inativo' | 'Vencido';

const filterDescriptions: Record<FilterType, string> = {
    'Ativo': "Alunos com matrícula ativa.",
    'Inativo': "Alunos que não estão mais ativos.",
    'Vencido': "Alunos com pagamentos vencidos."
};


export default function AlunosPage() {
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<FilterType>('Ativo');
    const [importJson, setImportJson] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    
    const studentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'students'), orderBy('name', 'asc'));
    }, [firestore]);

    const { data: allStudents, isLoading } = useCollection<Student>(studentsQuery);

    const filteredStudents = useMemo(() => {
        if (!allStudents) return [];

        let students = allStudents;

        if (activeFilter === 'Vencido') {
            students = students.filter(student => student.paymentStatus === 'Vencido');
        } else {
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
        router.push(`/alunos/${studentId}`);
    };

    const handleGenerateReport = () => {
        alert("A funcionalidade de gerar relatório será implementada em breve.");
    };

    const handleImport = async () => {
        if (!firestore) return;
        setIsImporting(true);

        try {
            const data = JSON.parse(importJson);
            if (!Array.isArray(data)) {
                throw new Error("O JSON precisa ser um array de alunos.");
            }

            const batch = writeBatch(firestore);
            let importedCount = 0;

            data.forEach(item => {
                const studentData: Partial<Student> = {
                    name: item["Nome Completo"] || item["Nome"] || item.name,
                    email: item["Email"] || item.email,
                    cpf: item["CPF"] || item.cpf,
                    phone: item["Whatsapp"] || item["Telefone"] || item.phone,
                    registrationDate: new Date().toISOString(),
                    status: 'Ativo',
                    paymentStatus: 'Pendente',
                    belt: item["Faixa"] || item.belt || 'Branca',
                };
                
                if (studentData.name) {
                    const docRef = collection(firestore, 'students');
                    batch.set(doc(docRef), studentData);
                    importedCount++;
                }
            });

            await batch.commit();

            toast({
                title: "Importação Concluída",
                description: `${importedCount} alunos foram importados com sucesso.`,
            });

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro na Importação",
                description: error.message || "Verifique o formato do JSON e tente novamente.",
            });
        } finally {
            setIsImporting(false);
            setImportJson('');
        }
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
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline">Importar JSON</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Importar Alunos via JSON</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Cole o conteúdo do seu arquivo JSON abaixo. Certifique-se de que é um array de objetos, onde cada objeto representa um aluno.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <Textarea 
                                        placeholder="Cole o JSON aqui..." 
                                        className="min-h-[200px]"
                                        value={importJson}
                                        onChange={(e) => setImportJson(e.target.value)}
                                    />
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleImport} disabled={isImporting || !importJson}>
                                            {isImporting ? 'Importando...' : 'Importar Agora'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <Link href="/alunos/novo">
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