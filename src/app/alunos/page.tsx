
import { AppLayout } from "@/components/layout/app-layout";
import { StudentsTable } from "@/components/students/students-table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function AlunosPage() {
    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Alunos</h1>
                 <Link href="/register">
                    <Button className="gap-1">
                        <PlusCircle className="h-4 w-4" />
                        Adicionar Aluno
                    </Button>
                </Link>
            </div>
             <div className="flex flex-1 rounded-lg shadow-sm">
                <StudentsTable />
            </div>
        </AppLayout>
    );
}
