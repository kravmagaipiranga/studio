
"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, where, orderBy } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { WomensMonthLead } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Star, Download, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WomensMonthTable } from "@/components/womens-month/womens-month-table";
import { v4 as uuidv4 } from "uuid";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function WomensMonthAdminPage() {
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [leads, setLeads] = useState<WomensMonthLead[]>([]);

  const leadsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'womensMonth'),
      where('year', '==', selectedYear),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, selectedYear]);

  const { data: initialLeads, isLoading } = useCollection<WomensMonthLead>(leadsQuery);

  useEffect(() => {
    if (initialLeads) {
      setLeads(initialLeads);
    }
  }, [initialLeads]);

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.whatsapp.includes(searchQuery)
  );

  const handleAddLead = () => {
    const newLead: WomensMonthLead = {
      id: `new_${uuidv4()}`,
      name: "",
      whatsapp: "",
      chosenClass: "",
      hasCompanions: false,
      year: selectedYear,
      attended: false,
      createdAt: new Date().toISOString(),
      isNew: true,
    };
    setLeads(prev => [newLead, ...prev]);
  };

  const handleExport = () => {
    if (leads.length === 0) return;
    const headers = ["Nome", "WhatsApp", "Turma", "Acompanhantes", "Nomes Acomp.", "Compareceu", "Inscrição"];
    const csvContent = [
      headers.join(','),
      ...leads.map(l => [
        l.name, 
        l.whatsapp, 
        l.chosenClass, 
        l.hasCompanions ? "Sim" : "Não", 
        `"${l.companionNames || ''}"`,
        l.attended ? "Sim" : "Não", 
        l.createdAt
      ].join(','))
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `campanha_mulheres_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Star className="h-6 w-6 text-pink-500 fill-pink-500" />
            Gestão: Mês das Mulheres
          </h1>
          <p className="text-muted-foreground">Acompanhe as inscrições da campanha de aulas gratuitas.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/mes-das-mulheres/registro" target="_blank">
            <Button variant="outline" className="text-pink-600 border-pink-200 hover:bg-pink-50">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver Formulário Público
            </Button>
          </Link>
          <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {[2026, 2027, 2028, 2029, 2030].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddLead} className="bg-pink-600 hover:bg-pink-700">
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Registro
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={leads.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-pink-50 border-pink-200 dark:bg-pink-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-pink-800">Total Inscritas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-900">
              {isLoading ? <Skeleton className="h-8 w-12" /> : leads.length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Compareceram</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">
              {isLoading ? <Skeleton className="h-8 w-12" /> : leads.filter(l => l.attended).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversão Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : 
                leads.length > 0 ? `${Math.round((leads.filter(l => l.attended).length / leads.length) * 100)}%` : "0%"
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nome ou WhatsApp..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <WomensMonthTable 
            leads={filteredLeads} 
            setLeads={setLeads} 
            isLoading={isLoading} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
