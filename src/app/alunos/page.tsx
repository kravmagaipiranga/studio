
"use client";

import { useRef } from "react";
import { collection, doc } from "firebase/firestore";
import Link from "next/link";
import { StudentsTable } from "@/components/students/students-table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Upload } from "lucide-react";
import { Student } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";

export default function AlunosPage() {
    const firestore = useFirestore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const studentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'students');
    }, [firestore]);

    const { data: students, isLoading } = useCollection<Student>(studentsCollection);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text !== 'string') return;

            try {
                const lines = text.split('\n').filter(line => line.trim() !== '');
                if (lines.length < 2) {
                    toast({
                        variant: "destructive",
                        title: "Arquivo Inválido",
                        description: "O arquivo CSV precisa conter um cabeçalho e pelo menos uma linha de dados.",
                    });
                    return;
                }

                const headers = lines.shift()!.trim().split(',').map(h => h.trim());
                
                const requiredHeaders = ['name', 'email'];
                const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

                if (missingHeaders.length > 0) {
                     toast({
                        variant: "destructive",
                        title: "Erro no Cabeçalho do CSV",
                        description: `O arquivo CSV precisa ter as colunas obrigatórias: ${requiredHeaders.join(', ')}.`,
                    });
                    return;
                }

                let importedCount = 0;
                lines.forEach((line) => {
                    const data = line.trim().split(',');
                    const studentData = headers.reduce((obj, header, i) => {
                        const value = data[i]?.trim() || '';
                        if (value) {
                             obj[header as keyof Student] = value as any;
                        }
                        return obj;
                    }, {} as Partial<Student>);

                    if (firestore && studentsCollection) {
                        const newStudentId = doc(studentsCollection).id;
                        
                        const beltValue = studentData.belt || 'Branca';
                        const formattedBelt = beltValue.charAt(0).toUpperCase() + beltValue.slice(1).toLowerCase();

                        const newStudent: Omit<Student, 'id'> = {
                            name: studentData.name || '',
                            email: studentData.email || '',
                            dob: studentData.dob || '',
                            cpf: studentData.cpf || '',
                            phone: studentData.phone || '',
                            belt: formattedBelt,
                            status: studentData.status || 'Ativo',
                            paymentStatus: studentData.paymentStatus || 'Pendente',
                            registrationDate: new Date().toISOString(),
                            tshirtSize: studentData.tshirtSize || 'M',
                            pantsSize: studentData.pantsSize || '40',
                            emergencyContacts: studentData.emergencyContacts || '',
                            medicalHistory: studentData.medicalHistory || '',
                            generalNotes: studentData.generalNotes || '',
                            planType: studentData.planType,
                            planValue: studentData.planValue ? parseFloat(studentData.planValue as any) : undefined,
                            lastPaymentDate: studentData.lastPaymentDate,
                            planExpirationDate: studentData.planExpirationDate,
                        };
                        
                        const docRef = doc(firestore, "students", newStudentId);
                        setDocumentNonBlocking(docRef, { ...newStudent, id: newStudentId }, { merge: true });
                        importedCount++;
                    }
                });

                toast({
                    title: "Importação Concluída!",
                    description: `${importedCount} alunos foram importados com sucesso.`,
                });

            } catch (error) {
                 console.error("Erro ao importar:", error);
                 toast({
                    variant: "destructive",
                    title: "Erro ao Importar",
                    description: "Não foi possível processar o arquivo. Verifique o formato e os dados.",
                });
            } finally {
                // Reset file input
                if(fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        };
        reader.readAsText(file, 'UTF-8');
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Alunos</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleImportClick}>
                        <Upload className="h-4 w-4 mr-2" />
                        Importar Alunos
                    </Button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".csv"
                        onChange={handleFileChange}
                    />
                    <Link href="/alunos/novo">
                        <Button>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Adicionar Aluno
                        </Button>
                    </Link>
                </div>
            </div>
             <div className="flex flex-1 rounded-lg shadow-sm mt-4">
                <StudentsTable students={students || []} isLoading={isLoading} />
            </div>
        </>
    );
}
