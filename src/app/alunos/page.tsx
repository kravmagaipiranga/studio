import { StudentsTable } from "@/components/students/students-table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Upload } from "lucide-react";
import Link from "next/link";

export default function AlunosPage() {
    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Alunos</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Importar Alunos
                    </Button>
                    <Link href="/register">
                        <Button>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Adicionar Aluno
                        </Button>
                    </Link>
                </div>
            </div>
             <div className="flex flex-1 rounded-lg shadow-sm mt-4">
                <StudentsTable />
            </div>
        </>
    );
}
