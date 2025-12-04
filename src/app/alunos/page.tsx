
"use client";

import { useState } from "react";
import Link from "next/link";
import { collection, doc, writeBatch } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, User, Search, Import, HelpCircle } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ColumnMapping {
    name: keyof Student;
    label: string;
    value: string;
    hint: string;
}

const initialMappings: ColumnMapping[] = [
    { name: 'name', label: 'Nome Completo', value: '', hint: 'Coluna com o nome completo do aluno. Ex: Nome Completo' },
    { name: 'email', label: 'Email', value: '', hint: 'Coluna com o email do aluno. Ex: E-mail' },
    { name: 'phone', label: 'Telefone/WhatsApp', value: '', hint: 'Ex: WhatsApp' },
    { name: 'cpf', label: 'CPF', value: '', hint: 'Ex: CPF' },
    { name: 'dob', label: 'Data de Nascimento', value: '', hint: 'Use o formato da sua planilha. Ex: Data de Nascimento' },
    { name: 'startDate', label: 'Início dos Treinos', value: '', hint: 'Ex: Início dos Treinos' },
    { name: 'belt', label: 'Graduação (Faixa)', value: '', hint: 'Ex: Graduação Atual (Faixa)' },
    { name: 'planType', label: 'Tipo de Plano', value: '', hint: 'Ex: Tipo de Plano' },
    { name: 'planValue', label: 'Valor do Plano', value: '', hint: 'Ex: Valor do Plano' },
    { name: 'tshirtSize', label: 'Tamanho da Camiseta', value: '', hint: 'Ex: Camiseta (Tamanho)' },
    { name: 'pantsSize', label: 'Tamanho da Calça', value: '', hint: 'Ex: Calça (Tamanho)' },
    { name: 'emergencyContacts', label: 'Contatos de Emergência', value: '', hint: 'Ex: Contato de Emergência' },
    { name: 'medicalHistory', label: 'Histórico Médico', value: '', hint: 'Ex: Histórico Médico' },
    { name: 'generalNotes', label: 'Observações Gerais', value: '', hint: 'Ex: Observações Gerais' },
];

// Simple TSV to JSON parser
function tsvToObjects(tsv: string): Record<string, string>[] {
    const lines = tsv.trim().split('\n');
    const headers = lines[0].split('\t').map(h => h.trim());
    return lines.slice(1).map(line => {
        const values = line.split('\t');
        const obj: Record<string, string> = {};
        headers.forEach((header, i) => {
            obj[header] = values[i] || '';
        });
        return obj;
    });
}

export default function AlunosPage() {
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [pastedData, setPastedData] = useState("");
    const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>(initialMappings);

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

    const handleMappingChange = (name: keyof Student, value: string) => {
        setColumnMappings(prev => prev.map(m => m.name === name ? { ...m, value } : m));
    };

    const handleImport = async () => {
        if (!firestore) {
            toast({ variant: "destructive", title: "Erro", description: "Conexão com o banco de dados não disponível." });
            return;
        }
        if (!pastedData) {
            toast({ variant: "destructive", title: "Erro", description: "A área de dados da planilha está vazia." });
            return;
        }
        
        const mappingLookup = new Map(columnMappings.map(m => [m.name, m.value]));
        const nameColumn = mappingLookup.get('name');

        if (!nameColumn) {
             toast({ variant: "destructive", title: "Mapeamento Incompleto", description: "Você deve fornecer o nome da coluna para 'Nome Completo'." });
             return;
        }

        try {
            const dataAsObjects = tsvToObjects(pastedData);
            if (!dataAsObjects.length) {
                 toast({ variant: "destructive", title: "Erro de Formato", description: "Nenhum dado encontrado. Copie e cole da planilha, incluindo o cabeçalho." });
                return;
            }

            const batch = writeBatch(firestore);
            let importedCount = 0;

            dataAsObjects.forEach(item => {
                const studentId = doc(collection(firestore, "students")).id;
                
                const studentData: Partial<Student> = removeUndefinedFields({
                    id: studentId,
                    name: item[mappingLookup.get('name')!] || '',
                    email: item[mappingLookup.get('email')!] || '',
                    phone: item[mappingLookup.get('phone')!] || '',
                    cpf: item[mappingLookup.get('cpf')!] || '',
                    dob: item[mappingLookup.get('dob')!] ? new Date(item[mappingLookup.get('dob')!]).toISOString().split('T')[0] : '',
                    startDate: item[mappingLookup.get('startDate')!] ? new Date(item[mappingLookup.get('startDate')!]).toISOString().split('T')[0] : '',
                    belt: item[mappingLookup.get('belt')!] || 'Branca',
                    status: 'Ativo',
                    paymentStatus: 'Pendente',
                    planType: (item[mappingLookup.get('planType')!] as Student['planType']) || 'Mensal',
                    planValue: parseFloat(String(item[mappingLookup.get('planValue')!] || '200').replace(',', '.')) || 200,
                    tshirtSize: item[mappingLookup.get('tshirtSize')!] || 'M',
                    pantsSize: item[mappingLookup.get('pantsSize')!] || 'M',
                    emergencyContacts: item[mappingLookup.get('emergencyContacts')!] || '',
                    medicalHistory: item[mappingLookup.get('medicalHistory')!] || '',
                    generalNotes: item[mappingLookup.get('generalNotes')!] || '',
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
            setPastedData("");

        } catch (error) {
             console.error("Data Import Error:", error);
             toast({ variant: "destructive", title: "Erro ao Importar", description: "Verifique os dados colados ou o console para mais detalhes." });
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
                                    Ferramenta de Importação
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-4xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Importar Alunos da Planilha</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Siga os passos para importar seus dados.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto p-2">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">Passo 1: Mapeie Suas Colunas</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Digite o nome exato do cabeçalho da sua planilha para cada campo correspondente.
                                        </p>
                                        <div className="space-y-3">
                                            {columnMappings.map(mapping => (
                                                <div key={mapping.name} className="grid grid-cols-3 items-center gap-2">
                                                    <Label htmlFor={mapping.name} className="text-right flex items-center gap-1">
                                                        {mapping.label}
                                                         <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{mapping.hint}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </Label>
                                                    <Input
                                                        id={mapping.name}
                                                        value={mapping.value}
                                                        onChange={(e) => handleMappingChange(mapping.name, e.target.value)}
                                                        className="col-span-2"
                                                        placeholder={mapping.hint}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">Passo 2: Cole Seus Dados</h3>
                                         <p className="text-sm text-muted-foreground">
                                            Vá para sua planilha (Google Sheets/Excel), selecione todas as linhas (incluindo o cabeçalho) e copie. Depois, cole no campo abaixo.
                                        </p>
                                        <Textarea 
                                            placeholder="Cole os dados copiados da sua planilha aqui..."
                                            className="h-96"
                                            value={pastedData}
                                            onChange={(e) => setPastedData(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleImport}>Importar Alunos</AlertDialogAction>
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

    