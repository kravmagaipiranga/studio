
"use client";

import { useState } from "react";
import Link from "next/link";
import { SalesTable } from "@/components/sales/sales-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Sale, Student } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";

export default function VendasPage() {
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState("");

    const salesCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'sales');
    }, [firestore]);

    const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesCollection);

    const filteredSales = (sales || []).filter(sale =>
        sale.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.item.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Vendas Gerais</h1>
                <div className="flex items-center gap-2">
                     <Link href="/vendas/novo">
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nova Venda
                        </Button>
                     </Link>
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
                <SalesTable 
                    sales={filteredSales}
                    isLoading={isLoadingSales}
                />
            </div>
        </>
    );
}

    
