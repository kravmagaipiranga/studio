"use client";

import { useState, useRef } from "react";
import { StudentsTable } from "@/components/students/students-table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Upload } from "lucide-react";
import Link from "next/link";
import { students as initialStudents } from "@/lib/data";
import { Student } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function AlunosPage() {
    const [students, setStudents] = useState<Student[]>(initialStudents);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

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
                const headers = lines.shift()?.trim().split(',') || [];
                
                const requiredHeaders = ['name', 'email', 'dob', 'cpf', 'phone', 'belt'];
                const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

                if (missingHeaders.length > 0) {
                     toast({
                        variant: "destructive",
                        title: "Erro no Cabeçalho do CSV",
                        description: `O arquivo CSV precisa ter as colunas obrigatórias: ${requiredHeaders.join(', ')}.`,
                    });
                    return;
                }

                const newStudents = lines.map((line, index) => {
                    const data = line.trim().split(',');
                    const studentData = headers.reduce((obj, header, i) => {
                        obj[header.trim() as keyof Student] = data[i] as any;
                        return obj;
                    }, {} as Partial<Student>);

                    // Create a placeholder student object with default values
                    const newStudent: Student = {
                        id: `imported-${Date.now()}-${index}`,
                        avatar: `https://picsum.photos/seed/${Date.now() + index}/100/100`,
                        status: 'Ativo',
                        paymentStatus: 'Pendente',
                        registrationDate: new Date().toISOString(),
                        plan: 'Básico',
                        tshirtSize: 'M',
                        pantsSize: '40',
                        emergencyContacts: '',
                        ...studentData,
                    };
                    
                    return newStudent;
                });

                setStudents(prevStudents => [...prevStudents, ...newStudents]);
                toast({
                    title: "Importação Concluída!",
                    description: `${newStudents.length} alunos foram importados com sucesso.`,
                });
            } catch (error) {
                 toast({
                    variant: "destructive",
                    title: "Erro ao Importar",
                    description: "Não foi possível processar o arquivo. Verifique o formato.",
                });
            } finally {
                // Reset file input
                if(fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }

        };
        reader.readAsText(file);
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
                    <Link href="/register">
                        <Button>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Adicionar Aluno
                        </Button>
                    </Link>
                </div>
            </div>
             <div className="flex flex-1 rounded-lg shadow-sm mt-4">
                <StudentsTable students={students} />
            </div>
        </>
    );
}
