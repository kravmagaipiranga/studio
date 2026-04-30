
"use client";

import { useState, useEffect, useMemo } from "react";
import { SalesTable } from "@/components/sales/sales-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search, DollarSign, ShoppingCart, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Sale, Student } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { downloadCSV } from "@/lib/export-csv";

export default function VendasPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [sales, setSales] = useState<Sale[]>([]);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

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

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

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
            } catch (error) { }
        });
        
        return { 
            salesRevenueThisMonth: revenue,
            salesCountThisMonth: count,
            pendingRevenue: pending,
        };
    }, [sales]);

    const filteredSales = useMemo(() => {
        return (sales || []).filter(sale =>
            sale.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sale.item.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [sales, searchQuery]);

    // Pagination logic
    const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
    const paginatedSales = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredSales.slice(start, start + itemsPerPage);
    }, [filteredSales, currentPage, itemsPerPage]);

    const handleExportData = () => {
        if (!filteredSales || filteredSales.length === 0) {
            toast({
                variant: "destructive",
                title: "Nenhum dado para exportar",
                description: "A seleção de filtros atual não retornou nenhum registro.",
            });
            return;
        }
        const headers = [
            "ID", "ID Aluno", "Nome do Aluno", "Item",
            "Valor", "Data", "Forma de Pagamento", "Status Pagamento"
        ];
        const rows = filteredSales.map(s => [
            s.id, s.studentId, s.studentName, s.item,
            s.value, s.date, s.paymentMethod, s.paymentStatus
        ]);
        downloadCSV('export_vendas', headers, rows);
        toast({
            title: "Exportação concluída!",
            description: `${filteredSales.length} registros foram exportados.`,
        });
    };

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

    const isLoading = isLoadingSales || isLoadingStudents;

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-3">
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
                    <Button variant="outline" onClick={handleExportData}>
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
                        placeholder="Buscar por aluno ou item..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <DatePickerWithRange />
            </div>
             <Card className="flex flex-col shadow-sm">
                <CardContent className="p-0">
                    <SalesTable 
                        sales={paginatedSales}
                        setSales={setSales}
                        allStudents={students || []}
                        isLoading={isLoading}
                    />
                    
                    {!isLoading && filteredSales.length > 0 && (
                        <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
                            <div className="text-sm text-muted-foreground">
                                Mostrando <strong>{Math.min(filteredSales.length, (currentPage - 1) * itemsPerPage + 1)}</strong> a <strong>{Math.min(filteredSales.length, currentPage * itemsPerPage)}</strong> de <strong>{filteredSales.length}</strong> vendas
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
