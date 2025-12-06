
"use client";

import { useState, useMemo, useEffect } from "react";
import { AppointmentsTable } from "@/components/appointments/appointments-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search, CalendarCheck } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Appointment } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';

export default function AgendamentosPage() {
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState("");
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    const appointmentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'appointments');
    }, [firestore]);

    const { data: initialAppointments, isLoading } = useCollection<Appointment>(appointmentsCollection);

    useEffect(() => {
        if (initialAppointments) {
            setAppointments(initialAppointments);
        }
    }, [initialAppointments]);

    const appointmentsThisWeekCount = useMemo(() => {
        if (!appointments) return 0;
    
        const today = new Date();
        const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        const end = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
        const endOfSaturday = new Date(end);
        endOfSaturday.setDate(endOfSaturday.getDate() - 1);
        
        return appointments.filter(appointment => {
            try {
                const classDate = parseISO(appointment.classDate);
                return isWithinInterval(classDate, { start, end: endOfSaturday });
            } catch (error) {
                return false;
            }
        }).length;
    }, [appointments]);

    const filteredAppointments = (appointments || []).filter(appointment =>
        appointment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (appointment.email && appointment.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleAddNewAppointment = () => {
       const newAppointment: Appointment = {
         id: `new_${uuidv4()}`,
         name: "",
         whatsapp: "",
         email: "",
         classDate: new Date().toISOString().split('T')[0],
         classTime: "20:00",
         notes: "",
         isNew: true,
         enrolled: false,
         attended: false,
         missed: false,
       };
       setAppointments(prev => [newAppointment, ...prev]);
    };

    return (
        <>
            <div className="grid gap-4 md:grid-cols-3 mb-4">
                <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Agendamentos na Semana
                        </CardTitle>
                        <CalendarCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                            {isLoading ? <Skeleton className="h-8 w-12"/> : appointmentsThisWeekCount}
                        </div>
                        <p className="text-xs text-muted-foreground">De Segunda a Sábado</p>
                    </CardContent>
                </Card>
            </div>
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Agendamentos</h1>
                <div className="flex items-center gap-2">
                    <Button onClick={handleAddNewAppointment}>
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
                    setAppointments={setAppointments}
                    isLoading={isLoading}
                />
            </div>
        </>
    );
}
