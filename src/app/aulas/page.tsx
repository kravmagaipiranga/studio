
"use client";

import { useState, useEffect, useMemo } from "react";
import { PrivateClassesTable } from "@/components/private-classes/private-classes-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search, CalendarCheck, ClipboardList, DollarSign } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { PrivateClass } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';


export default function AulasPage() {
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState("");
    const [privateClasses, setPrivateClasses] = useState<PrivateClass[]>([]);

    const privateClassesCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'privateClasses');
    }, [firestore]);

    const { data: initialPrivateClasses, isLoading } = useCollection<PrivateClass>(privateClassesCollection);
    
    useEffect(() => {
        if (initialPrivateClasses) {
            setPrivateClasses(initialPrivateClasses);
        }
    }, [initialPrivateClasses]);

     const { classesThisWeekCount, classesThisMonthCount, revenueThisMonth } = useMemo(() => {
        if (!privateClasses) return { classesThisWeekCount: 0, classesThisMonthCount: 0, revenueThisMonth: 0 };
    
        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);

        let weeklyCount = 0;
        let monthlyCount = 0;
        let monthlyRevenue = 0;

        privateClasses.forEach(pc => {
            try {
                const classDate = parseISO(pc.classDate);
                if (isWithinInterval(classDate, { start: weekStart, end: weekEnd })) {
                    weeklyCount++;
                }
                if (isWithinInterval(classDate, { start: monthStart, end: monthEnd })) {
                    monthlyCount++;
                    if(pc.paymentStatus === "Pago") {
                        monthlyRevenue += pc.paymentAmount || 0;
                    }
                }
            } catch (error) {
                // Ignore invalid dates
            }
        });
        
        return { 
            classesThisWeekCount: weeklyCount,
            classesThisMonthCount: monthlyCount,
            revenueThisMonth: monthlyRevenue
        };
    }, [privateClasses]);
    
    const handleAddNewPrivateClass = () => {
       if (!firestore) return;

       const newClass: PrivateClass = {
         id: `new_${uuidv4()}`,
         studentName: "",
         classDate: new Date().toISOString().split('T')[0],
         numberOfClasses: 1,
         pricePerClass: 150,
         paymentAmount: 150, // Calculated from numberOfClasses * pricePerClass
         paymentStatus: "Pendente",
         paymentMethod: "Pendente",
         isNew: true,
       };
       setPrivateClasses(prev => [newClass, ...prev]);
    };
    
    const filteredClasses = (privateClasses || []).filter(pc =>
        pc.studentName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <div className="grid gap-4 md:grid-cols-3 mb-4">
                <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Aulas na Semana
                        </CardTitle>
                        <CalendarCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                            {isLoading ? <Skeleton className="h-8 w-12"/> : classesThisWeekCount}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aulas no Mês</CardTitle>
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? <Skeleton className="h-8 w-12"/> : classesThisMonthCount}
                        </div>
                    </CardContent>
                </Card>
                 <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                            Valor Recebido (Mês)
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                            {isLoading ? <Skeleton className="h-8 w-24"/> : `R$ ${revenueThisMonth.toFixed(2)}`}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Aulas Particulares</h1>
                <div className="flex items-center gap-2">
                    <Button onClick={handleAddNewPrivateClass}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agendar Aula
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
                        placeholder="Buscar por aluno..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <DatePickerWithRange />
            </div>
             <div className="flex flex-1 rounded-lg shadow-sm mt-4">
                <PrivateClassesTable 
                    privateClasses={filteredClasses}
                    setPrivateClasses={setPrivateClasses}
                    isLoading={isLoading}
                />
            </div>
        </>
    );
}
