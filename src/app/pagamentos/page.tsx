
"use client";

import { useState } from "react";
import { PaymentsTable } from "@/components/payments/payments-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { RegisterPaymentDialog } from "@/components/payments/register-payment-dialog";
import { students as initialStudents } from "@/lib/data";
import { Student } from "@/lib/types";

export default function PagamentosPage() {
    const [students, setStudents] = useState<Student[]>(initialStudents);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handlePaymentRegistered = (updatedStudent: Student) => {
        setStudents(prevStudents =>
            prevStudents.map(s => s.id === updatedStudent.id ? updatedStudent : s)
        );
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Gestão de Pagamentos</h1>
                <div className="flex items-center gap-2">
                     <Button onClick={() => setIsDialogOpen(true)}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Adicionar Pagamento
                    </Button>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Gerar Relatório
                    </Button>
                </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por nome..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <DatePickerWithRange />
            </div>
             <div className="flex flex-1 rounded-lg shadow-sm mt-4">
                <PaymentsTable 
                    students={filteredStudents}
                    setStudents={setStudents}
                />
            </div>

            {/* Dialog para adicionar pagamento sem aluno pré-selecionado */}
            <RegisterPaymentDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onPaymentRegistered={handlePaymentRegistered}
                allStudents={students}
            />
        </>
    );
}
