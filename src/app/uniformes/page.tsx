
"use client";

import { useState, useMemo, useEffect } from "react";
import { UniformsTable } from "@/components/uniforms/uniforms-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search, Shirt, PackageCheck, PackageX } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { UniformOrder, Student } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function UniformesPage() {
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState("");
    const [uniformOrders, setUniformOrders] = useState<UniformOrder[]>([]);

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
    
    const { pendingPickup, pendingPayment } = useMemo(() => {
        if (!uniformOrders) return { pendingPickup: 0, pendingPayment: 0 };
        
        const pickup = uniformOrders.filter(o => !o.materialPickedUp && o.paymentStatus === 'Pago').length;
        const payment = uniformOrders.filter(o => o.paymentStatus === 'Pendente').length;
        
        return { pendingPickup: pickup, pendingPayment: payment };
    }, [uniformOrders]);

    const handleAddNewOrder = () => {
       const newOrder: UniformOrder = {
         id: `new_${uuidv4()}`,
         studentId: "",
         studentName: "",
         orderDate: new Date().toISOString().split('T')[0],
         items: "",
         totalValue: 0,
         paymentStatus: 'Pendente',
         paymentDate: undefined,
         materialPickedUp: false,
         isNew: true,
       };
       setUniformOrders(prev => [newOrder, ...prev]);
    };
    
    const filteredOrders = useMemo(() => {
       if (!uniformOrders) return [];
       return uniformOrders.filter(order =>
         order.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
         order.items.toLowerCase().includes(searchQuery.toLowerCase())
       );
    }, [uniformOrders, searchQuery]);

    const isLoading = isLoadingOrders || isLoadingStudents;

    return (
        <>
            <div className="grid gap-4 md:grid-cols-3 mb-4">
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
             <div className="flex flex-1 rounded-lg shadow-sm mt-4">
                <UniformsTable 
                    orders={filteredOrders}
                    setOrders={setUniformOrders}
                    allStudents={students || []}
                    isLoading={isLoading}
                />
            </div>
        </>
    );
}
