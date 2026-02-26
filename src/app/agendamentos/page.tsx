
"use client";

import { useState, useMemo, useEffect } from "react";
import { AppointmentsTable } from "@/components/appointments/appointments-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search, CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Appointment } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AgendamentosPage() {
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState("");
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isMounted, setIsMounted] = useState(false);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const appointmentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'appointments'), orderBy('classDate', 'desc'));
    }, [firestore]);

    const { data: initialAppointments, isLoading: isLoadingCollection } = useCollection<Appointment>(appointmentsCollection);

    const isLoading = isLoadingCollection || !isMounted;

    useEffect(() => {
        if (initialAppointments) {
            setAppointments(initialAppointments);
        }
    }, [initialAppointments]);

    // Reset pagination on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const appointmentsThisWeekCount = useMemo(() => {
        if (!appointments || !isMounted) return 0;
    
        const today = new Date();
        const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        const end = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
        const endOfSaturday = new Date(end);
        endOfSaturday.setDate(endOfSaturday.getDate() - 1);
        
        return appointments.filter(appointment => {
            try {
                if (!appointment.classDate) return false;
                const classDate = parseISO(appointment.classDate);
                return isWithinInterval(classDate, { start, end: endOfSaturday });
            } catch (error) {
                return false;
            }
        }).length;
    }, [appointments, isMounted]);

    const filteredAppointments = useMemo(() => {
        return (appointments || []).filter(appointment =>
            appointment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (appointment.email && appointment.email.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [appointments, searchQuery]);

    // Pagination logic
    const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
    const paginatedAppointments = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredAppointments.slice(start, start + itemsPerPage);
    }, [filteredAppointments, currentPage, itemsPerPage]);

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
        <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-3">
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
            <div className="flex items-center justify-between gap-4">
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
             <Card className="flex flex-col shadow-sm">
                <CardContent className="p-0">
                    <AppointmentsTable 
                        appointments={paginatedAppointments}
                        setAppointments={setAppointments}
                        isLoading={isLoading}
                    />
                    
                    {/* Pagination Controls */}
                    {!isLoading && filteredAppointments.length > 0 && (
                        <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
                            <div className="text-sm text-muted-foreground">
                                Mostrando <strong>{Math.min(filteredAppointments.length, (currentPage - 1) * itemsPerPage + 1)}</strong> a <strong>{Math.min(filteredAppointments.length, currentPage * itemsPerPage)}</strong> de <strong>{filteredAppointments.length}</strong> agendamentos
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Por página:</span>
                                    <Select 
                                        value={String(itemsPerPage)} 
                                        onValueChange={(val) => {
                                            setItemsPerPage(Number(val));
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="h-8 w-20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="text-xs font-medium px-2">
                                        Página {currentPage} de {totalPages}
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
