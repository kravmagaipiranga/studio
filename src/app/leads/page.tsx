
"use client";

import { useState, useMemo, useEffect } from "react";
import { LeadsTable } from "@/components/leads/leads-table";
import { LeadImportDialog } from "@/components/leads/lead-import-dialog";
import { Button } from "@/components/ui/button";
import { Download, Search, Phone, PhoneForwarded, PhoneOff, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Lead } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeadsPage() {
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState("");
    const [leads, setLeads] = useState<Lead[]>([]);

    const leadsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'leads'), orderBy('contactDate', 'desc'));
    }, [firestore]);

    const { data: initialLeads, isLoading } = useCollection<Lead>(leadsCollection);

    useEffect(() => {
        if (initialLeads) {
            setLeads(initialLeads);
        }
    }, [initialLeads]);
    
    const { totalLeads, contactedLeads, pendingLeads } = useMemo(() => {
        if (!leads) return { totalLeads: 0, contactedLeads: 0, pendingLeads: 0 };
        
        const total = leads.length;
        const contacted = leads.filter(l => l.contacted).length;
        
        return { totalLeads: total, contactedLeads: contacted, pendingLeads: total - contacted };
    }, [leads]);

    const filteredLeads = useMemo(() => {
       if (!leads) return [];
       return leads.filter(lead =>
         lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         lead.phone.toLowerCase().includes(searchQuery.toLowerCase())
       );
    }, [leads, searchQuery]);

    const handleExportData = () => {
        if (!leads) return;

        const headers = ["Data Contato", "Nome", "Telefone", "Contactado"];
        const csvContent = [
            headers.join(','),
            ...leads.map(l => [l.contactDate, l.name, l.phone, l.contacted].join(','))
        ].join('\n');

        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'export_leads.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div className="grid gap-4 md:grid-cols-3 mb-4">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? <Skeleton className="h-8 w-12"/> : totalLeads}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                            Leads Contactados
                        </CardTitle>
                        <PhoneForwarded className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                            {isLoading ? <Skeleton className="h-8 w-12"/> : contactedLeads}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Leads Pendentes
                        </CardTitle>
                        <PhoneOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                            {isLoading ? <Skeleton className="h-8 w-12"/> : pendingLeads}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Leads CAT CPKM</h1>
                <div className="flex items-center gap-2">
                    <LeadImportDialog>
                        <Button>
                            <Upload className="mr-2 h-4 w-4" />
                            Importar Leads
                        </Button>
                    </LeadImportDialog>
                    <Button variant="outline" onClick={handleExportData}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar Dados
                    </Button>
                </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por nome ou telefone..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
             <div className="flex flex-1 rounded-lg shadow-sm mt-4">
                <LeadsTable 
                    leads={filteredLeads}
                    setLeads={setLeads}
                    isLoading={isLoading}
                />
            </div>
        </>
    );
}
