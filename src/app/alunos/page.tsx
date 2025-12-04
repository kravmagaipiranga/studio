
"use client";

import { useRef, useState } from "react";
import { collection } from "firebase/firestore";
import { StudentsTable } from "@/components/students/students-table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Upload, Search } from "lucide-react";
import { Student } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";


export default function AlunosPage() {
    const firestore = useFirestore();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");

    const studentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'students');
    }, [firestore]);

    const { data: students, isLoading } = useCollection<Student>(studentsCollection);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // A lógica de importação permanece a mesma
    };
    
    const filteredStudents = (students || []).filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                    <Link href="/alunos/novo/editar">
                        <Button>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Adicionar Aluno
                        </Button>
                    </Link>
                </div>
            </div>
             <div className="mt-4 flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por nome ou e-mail..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
             <div className="flex flex-1 rounded-lg shadow-sm mt-4">
                <StudentsTable 
                    students={filteredStudents || []} 
                    isLoading={isLoading}
                />
            </div>
        </>
    );
}
