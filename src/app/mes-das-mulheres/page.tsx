"use client";

import { useState, useMemo, useEffect } from "react";
import { WomensMonthTable } from "@/components/womens-month/womens-month-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search, Star, Users, Clock } from "lucide-react";
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
            const sorted = [...initialLeads].sort((a, b) => 
                a.name.localeCompare(b.name, 'pt-BR')
            );
            setLeads(sorted);
        }
    }, [initialLeads]);

    const metrics = useMemo(() => {
        const data = leads || [];
        const classes = {
            "Segundas e Quartas 18h": 0,
            "Terças e Quintas 19h": 0,
            "Segundas e Quartas 20h": 0,
            "Sábados 10h30": 0
        };
        
        data.forEach(lead => {
            if (classes.hasOwnProperty(lead.chosenClass)) {
                classes[lead.chosenClass as keyof typeof classes]++;
            }
        });

        return {
            total: data.length,
            attended: data.filter(l => l.attended).length,
            withCompanions: data.filter(l => l.hasCompanions).length,
            byClass: classes
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
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Visão Geral</h3>
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-pink-600 text-white border-none shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-bold uppercase">Total de Inscritas</CardTitle>
                            <Star className="h-4 w-4 text-white/80" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black">
                                {isLoading ? <Skeleton className="h-9 w-12 bg-white/20"/> : metrics.total}
                            </div>
                            <p className="text-xs text-white/70 mt-1">Inscrições acumuladas no ano</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-emerald-600 text-white border-none shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-bold uppercase">Presenças Confirmadas</CardTitle>
                            <Users className="h-4 w-4 text-white/80" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black">
                                {isLoading ? <Skeleton className="h-9 w-12 bg-white/20"/> : metrics.attended}
                            </div>
                            <p className="text-xs text-white/70 mt-1">Alunas que compareceram ao treino</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Inscritas por Turma</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Object.entries(metrics.byClass).map(([className, count]) => (
                        <Card key={className} className="bg-white border-pink-100 shadow-sm hover:border-pink-300 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-[10px] font-black uppercase text-pink-900 leading-tight">
                                    {className}
                                </CardTitle>
                                <Clock className="h-3 w-3 text-pink-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-pink-600">
                                    {isLoading ? <Skeleton className="h-8 w-10"/> : count}
                                </div>
                                <p className="text-[10px] text-muted-foreground">Vagas pré-reservadas</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
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
                        <Button onClick={handleAddNewLead} className="bg-pink-600 hover:bg-pink-700 font-bold">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Novo Registro
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4">
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
        </div>
    );
}
