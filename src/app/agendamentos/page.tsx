
"use client";

import { useState } from "react";
import { AppointmentsTable } from "@/components/appointments/appointments-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Appointment } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { AppointmentFormDialog } from "@/components/appointments/appointment-form-dialog";

export default function AgendamentosPage() {
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const appointmentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'appointments');
    }, [firestore]);

    const { data: appointments, isLoading } = useCollection<Appointment>(appointmentsCollection);

    const filteredAppointments = (appointments || []).filter(appointment =>
        appointment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (appointment.email && appointment.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <>
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Agendamentos</h1>
                <div className="flex items-center gap-2">
                     <Button onClick={() => setIsDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Novo Agendamento
                    </Button>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Gerar Relatório
                    </Button>
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
                <DatePickerWithRange />
            </div>
             <div className="flex flex-1 rounded-lg shadow-sm mt-4">
                <AppointmentsTable 
                    appointments={filteredAppointments}
                    isLoading={isLoading}
                />
            </div>
            <AppointmentFormDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />
        </>
    );
}

    