
"use client";

import { useState } from "react";
import { collection } from "firebase/firestore";
import { PaymentsTable } from "@/components/payments/payments-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { RegisterPaymentDialog } from "@/components/payments/register-payment-dialog";
import { Student } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";

export default function PagamentosPage() {
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const studentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'students');
    }, [firestore]);

    const { data: students, isLoading } = useCollection<Student>(studentsCollection);

    // This local state is no longer the source of truth, but can be kept for optimistic updates if needed,
    // or removed if all updates are handled directly by Firestore listeners.
    // For now, we'll let the listener handle updates.

    const filteredStudents = (students || []).filter(student =>
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
                    isLoading={isLoading}
                />
            </div>

            {/* The dialog can now receive the full list of students from Firestore */}
            <RegisterPaymentDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                allStudents={students || []}
            />
        </>
    );
}
