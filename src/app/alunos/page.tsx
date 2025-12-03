import { StudentsTable } from "@/components/students/students-table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function AlunosPage() {
    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Alunos</h1>
                 <Link href="/register">
                    <Button>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Adicionar Aluno
                    </Button>
                </Link>
            </div>
             <div className="flex flex-1 rounded-lg shadow-sm mt-4">
                <StudentsTable />
            </div>
        </>
    );
}
