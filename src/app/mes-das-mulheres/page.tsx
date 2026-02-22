"use client";

import { useState, useMemo, useEffect } from "react";
import { WomensMonthTable } from "@/components/womens-month/womens-month-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search, Star, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { WomensMonthLead } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
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

export default function WomensMonthAdminPage() {
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [leads, setLeads] = useState<WomensMonthLead[]>([]);

    const leadsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'womensMonth'), 
            where('year', '==', Number(selectedYear))
        );
    }, [firestore, selectedYear]);

    const { data: initialLeads, isLoading } = useCollection<WomensMonthLead>(leadsCollection);

    useEffect(() => {
        if (initialLeads) {
            // Ordenamos em memória para evitar a necessidade de índices compostos no Firestore
            const sorted = [...initialLeads].sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setLeads(sorted);
        }
    }, [initialLeads]);

    const metrics = useMemo(() => {
        const data = leads || [];
        return {
            total: data.length,
            attended: data.filter(l => l.attended).length,
            withCompanions: data.filter(l => l.hasCompanions).length
        };
    }, [leads]);

    const filteredLeads = leads.filter(lead =>
        lead.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddNewLead = () => {
       const newLead: WomensMonthLead = {
         id: `new_${uuidv4()}`,
         name: "",
         whatsapp: "",
         chosenClass: "",
         hasCompanions: false,
         companionNames: "",
         year: Number(selectedYear),
         attended: false,
         createdAt: new Date().toISOString(),
         isNew: true,
       };
       setLeads(prev => [newLead, ...prev]);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-pink-50 border-pink-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-pink-800">Total de Inscritas</CardTitle>
                        <Star className="h-4 w-4 text-pink-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-pink-900">
                            {isLoading ? <Skeleton className="h-8 w-12"/> : metrics.total}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-50 border-emerald-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-800">Presenças Confirmadas</CardTitle>
                        <Users className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-900">
                            {isLoading ? <Skeleton className="h-8 w-12"/> : metrics.attended}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Gestão Mês das Mulheres</h1>
                <div className="flex items-center gap-2">
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2026">2026</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleAddNewLead} className="bg-pink-600 hover:bg-pink-700">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Novo Registro
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
            </div>

             <div className="flex flex-1 rounded-lg shadow-sm border bg-card">
                <WomensMonthTable 
                    leads={filteredLeads}
                    setLeads={setLeads}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
}