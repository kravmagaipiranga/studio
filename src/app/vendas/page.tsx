
"use client";

import { useState, useEffect, useMemo } from "react";
import { SalesTable } from "@/components/sales/sales-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search, DollarSign, ShoppingCart, AlertCircle } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Sale, Student } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export default function VendasPage() {
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState("");
    const [sales, setSales] = useState<Sale[]>([]);

    const salesCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'sales');
    }, [firestore]);

    const studentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'students');
    }, [firestore]);

    const { data: initialSales, isLoading: isLoadingSales } = useCollection<Sale>(salesCollection);
    const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsCollection);

    useEffect(() => {
        if (initialSales) {
            setSales(initialSales);
        }
    }, [initialSales]);

    const { salesRevenueThisMonth, salesCountThisMonth, pendingRevenue } = useMemo(() => {
        if (!sales) return { salesRevenueThisMonth: 0, salesCountThisMonth: 0, pendingRevenue: 0 };
    
        const today = new Date();
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);

        let revenue = 0;
        let count = 0;
        let pending = 0;

        sales.forEach(sale => {
            try {
                if (isWithinInterval(parseISO(sale.date), { start: monthStart, end: monthEnd })) {
                    if (sale.paymentStatus === 'Pago') {
                        revenue += sale.value || 0;
                    }
                    count++;
                }
                if (sale.paymentStatus === 'Pendente') {
                    pending += sale.value || 0;
                }
            } catch (error) {
                // Ignore invalid dates
            }
        });
        
        return { 
            salesRevenueThisMonth: revenue,
            salesCountThisMonth: count,
            pendingRevenue: pending,
        };
    }, [sales]);


    const handleAddNewSale = () => {
        const newSale: Sale = {
            id: `new_${uuidv4()}`,
            studentId: "",
            studentName: "",
            item: "",
            value: 0,
            date: new Date().toISOString().split('T')[0],
            paymentMethod: "Pendente",
            paymentStatus: "Pendente",
            isNew: true,
        };
        setSales(prev => [newSale, ...prev]);
    };

    const filteredSales = (sales || []).filter(sale =>
        sale.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.item.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isLoading = isLoadingSales || isLoadingStudents;

    return (
        <>
            <div className="grid gap-4 md:grid-cols-3 mb-4">
                <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                            Total de Vendas (Mês)
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                            {isLoading ? <Skeleton className="h-8 w-24"/> : `R$ ${salesRevenueThisMonth.toFixed(2)}`}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Itens Vendidos (Mês)</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? <Skeleton className="h-8 w-12"/> : salesCountThisMonth}
                        </div>
                    </CardContent>
                </Card>
                 <Card className="bg-rose-50 border-rose-200 dark:bg-rose-950 dark:border-rose-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-rose-800 dark:text-rose-200">
                            Vendas Pendentes de Pgto.
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-900 dark:text-rose-100">
                             {isLoading ? <Skeleton className="h-8 w-24"/> : `R$ ${pendingRevenue.toFixed(2)}`}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Vendas Gerais</h1>
                <div className="flex items-center gap-2">
                     <Button onClick={handleAddNewSale}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nova Venda
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
                        placeholder="Buscar por aluno ou item..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <DatePickerWithRange />
            </div>
             <div className="flex flex-1 rounded-lg mt-4">
                <SalesTable 
                    sales={filteredSales}
                    setSales={setSales}
                    allStudents={students || []}
                    isLoading={isLoading}
                />
            </div>
        </>
    );
}
