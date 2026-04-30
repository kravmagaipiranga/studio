
"use client";

import { useState, useMemo, useEffect } from "react";
import { UniformsTable } from "@/components/uniforms/uniforms-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search, PackageCheck, PackageX, ChevronLeft, ChevronRight } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { UniformOrder, Student } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { downloadCSV } from "@/lib/export-csv";

export default function UniformesPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [uniformOrders, setUniformOrders] = useState<UniformOrder[]>([]);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const ordersCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'uniformOrders'), orderBy('orderDate', 'desc'));
    }, [firestore]);

    const studentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'students');
    }, [firestore]);

    const { data: initialOrders, isLoading: isLoadingOrders } = useCollection<UniformOrder>(ordersCollection);
    const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsCollection);

    useEffect(() => {
        if (initialOrders) {
            setUniformOrders(initialOrders);
        }
    }, [initialOrders]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);
    
    const { pendingPickup, pendingPayment } = useMemo(() => {
        if (!uniformOrders) return { pendingPickup: 0, pendingPayment: 0 };
        
        const pickup = uniformOrders.filter(o => !o.materialPickedUp && o.paymentStatus === 'Pago').length;
        const payment = uniformOrders.filter(o => o.paymentStatus === 'Pendente').length;
        
        return { pendingPickup: pickup, pendingPayment: payment };
    }, [uniformOrders]);

    const filteredOrders = useMemo(() => {
       if (!uniformOrders) return [];
       return uniformOrders.filter(order =>
         order.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
         order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
       );
    }, [uniformOrders, searchQuery]);

    // Pagination logic
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredOrders.slice(start, start + itemsPerPage);
    }, [filteredOrders, currentPage, itemsPerPage]);

    const handleExportData = () => {
        if (!filteredOrders || filteredOrders.length === 0) {
            toast({
                variant: "destructive",
                title: "Nenhum dado para exportar",
                description: "A seleção de filtros atual não retornou nenhum registro.",
            });
            return;
        }
        const headers = [
            "ID", "ID Aluno", "Nome do Aluno", "Data do Pedido",
            "Itens", "Valor Total",
            "Status Pagamento", "Data Pagamento", "Material Retirado"
        ];
        const rows = filteredOrders.map(o => [
            o.id, o.studentId, o.studentName, o.orderDate,
            (o.items ?? []).map(i => `${i.quantity}x ${i.name} (${i.size})`).join(' | '),
            o.totalValue,
            o.paymentStatus, o.paymentDate ?? '', o.materialPickedUp
        ]);
        downloadCSV('export_uniformes', headers, rows);
        toast({
            title: "Exportação concluída!",
            description: `${filteredOrders.length} registros foram exportados.`,
        });
    };

    const handleAddNewOrder = () => {
       const newOrder: UniformOrder = {
         id: `new_${uuidv4()}`,
         studentId: "",
         studentName: "",
         orderDate: new Date().toISOString().split('T')[0],
         items: [],
         totalValue: 0,
         paymentStatus: 'Pendente',
         paymentDate: undefined,
         materialPickedUp: false,
         isNew: true,
       };
       setUniformOrders(prev => [newOrder, ...prev]);
    };

    const isLoading = isLoadingOrders || isLoadingStudents;

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Aguardando Retirada
                        </CardTitle>
                        <PackageCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                            {isLoading ? <Skeleton className="h-8 w-12"/> : pendingPickup}
                        </div>
                         <p className="text-xs text-muted-foreground">Pedidos pagos aguardando retirada.</p>
                    </CardContent>
                </Card>
                <Card className="bg-rose-50 border-rose-200 dark:bg-rose-950 dark:border-rose-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-rose-800 dark:text-rose-200">
                            Aguardando Pagamento
                        </CardTitle>
                        <PackageX className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-900 dark:text-rose-100">
                            {isLoading ? <Skeleton className="h-8 w-12"/> : pendingPayment}
                        </div>
                        <p className="text-xs text-muted-foreground">Pedidos com pagamento pendente.</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Pedidos de Uniforme</h1>
                <div className="flex items-center gap-2">
                    <Button onClick={handleAddNewOrder}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Novo Pedido
                    </Button>
                    <Button variant="outline" onClick={handleExportData}>
                        <Download className="mr-2 h-4 w-4" />
                        Gerar Relatório
                    </Button>
                </div>
            </div>
            <div className="flex items-center justify-between gap-4">
                <div className="relative w-full max-sm:w-full sm:w-auto sm:min-w-[300px]">
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
                    <UniformsTable 
                        orders={paginatedOrders}
                        setOrders={setUniformOrders}
                        allStudents={students || []}
                        isLoading={isLoading}
                    />
                    
                    {!isLoading && filteredOrders.length > 0 && (
                        <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
                            <div className="text-sm text-muted-foreground">
                                Mostrando <strong>{Math.min(filteredOrders.length, (currentPage - 1) * itemsPerPage + 1)}</strong> a <strong>{Math.min(filteredOrders.length, currentPage * itemsPerPage)}</strong> de <strong>{filteredOrders.length}</strong> pedidos
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
