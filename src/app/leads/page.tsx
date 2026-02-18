
"use client";

import { useState, useMemo, useEffect } from "react";
import { LeadsTable } from "@/components/leads/leads-table";
import { LeadImportDialog } from "@/components/leads/lead-import-dialog";
import { Button } from "@/components/ui/button";
import { Download, Search, Phone, PhoneForwarded, PhoneOff, Upload, Trash2, PhoneIncoming, Calendar as CalendarIcon, FilterX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Lead } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, writeBatch } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import { isWithinInterval, parseISO, startOfMonth, endOfMonth, format, startOfDay, endOfDay, setMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const months = [
  { value: "0", label: "Janeiro" },
  { value: "1", label: "Fevereiro" },
  { value: "2", label: "Março" },
  { value: "3", label: "Abril" },
  { value: "4", label: "Maio" },
  { value: "5", label: "Junho" },
  { value: "6", label: "Julho" },
  { value: "7", label: "Agosto" },
  { value: "8", label: "Setembro" },
  { value: "9", label: "Outubro" },
  { value: "10", label: "Novembro" },
  { value: "11", label: "Dezembro" },
];

export default function LeadsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<string>("none");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

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
    
    const filteredLeads = useMemo(() => {
       if (!leads) return [];
       let filtered = leads;

       if (selectedMonth !== "none") {
           const year = new Date().getFullYear();
           const monthIdx = parseInt(selectedMonth);
           const start = startOfMonth(new Date(year, monthIdx, 1));
           const end = endOfMonth(new Date(year, monthIdx, 1));
           
           filtered = filtered.filter(lead => {
               try {
                   const contactDate = parseISO(lead.contactDate);
                   return isWithinInterval(contactDate, { start, end });
               } catch {
                   return false;
               }
           });
       } else if (dateRange?.from) {
           const range = {
               start: startOfDay(dateRange.from),
               end: endOfDay(dateRange.to || dateRange.from)
           };
           filtered = filtered.filter(lead => {
               try {
                   const contactDate = parseISO(lead.contactDate);
                   return isWithinInterval(contactDate, range);
               } catch {
                   return false;
               }
           });
       }

       if (searchQuery) {
         filtered = filtered.filter(lead =>
           lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           lead.phone.toLowerCase().includes(searchQuery.toLowerCase())
         );
       }

       return filtered;
    }, [leads, searchQuery, dateRange, selectedMonth]);

    // Apply "Last 30" limit if no filters are active
    const displayedLeads = useMemo(() => {
        const isFiltering = searchQuery !== "" || selectedMonth !== "none" || dateRange !== undefined;
        if (!isFiltering) {
            return filteredLeads.slice(0, 30);
        }
        return filteredLeads;
    }, [filteredLeads, searchQuery, selectedMonth, dateRange]);
    
    const { totalLeads, contactedLeads, pendingLeads, respondedLeads } = useMemo(() => {
        const data = filteredLeads || [];
        const total = data.length;
        const contacted = data.filter(l => l.contacted).length;
        const responded = data.filter(l => l.responded).length;
        
        return { totalLeads: total, contactedLeads: contacted, pendingLeads: total - contacted, respondedLeads: responded };
    }, [filteredLeads]);

    useEffect(() => {
        setSelectedLeads([]);
    }, [displayedLeads]);


    const handleExportData = () => {
        if (!leads) return;

        const headers = ["Data Contato", "Nome", "Telefone", "Contactado", "Respondeu"];
        const csvContent = [
            headers.join(','),
            ...leads.map(l => [l.contactDate, l.name, l.phone, l.contacted, !!l.responded].join(','))
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

    const handleToggleAll = () => {
        if (selectedLeads.length === displayedLeads.length) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(displayedLeads.map(l => l.id));
        }
    };

    const handleToggleOne = (leadId: string) => {
        setSelectedLeads(prev => 
            prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
        );
    };

    const handleBulkDelete = async () => {
        if (!firestore || selectedLeads.length === 0) return;

        const batch = writeBatch(firestore);
        selectedLeads.forEach(id => {
            const docRef = doc(firestore, 'leads', id);
            batch.delete(docRef);
        });

        try {
            await batch.commit();
            toast({
                title: "Leads Excluídos",
                description: `${selectedLeads.length} leads foram removidos com sucesso.`
            });
            setSelectedLeads([]);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao Excluir",
                description: "Não foi possível remover os leads selecionados."
            });
        }
    };
    
    const handleBulkMarkContacted = async () => {
        if (!firestore || selectedLeads.length === 0) return;

        const batch = writeBatch(firestore);
        selectedLeads.forEach(id => {
            const docRef = doc(firestore, 'leads', id);
            batch.update(docRef, { contacted: true });
        });

        try {
            await batch.commit();
            toast({
                title: "Leads Atualizados",
                description: `${selectedLeads.length} leads foram marcados como contactados.`
            });
            setSelectedLeads([]);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao Atualizar",
                description: "Não foi possível atualizar os leads selecionados."
            });
        }
    };

    const handleBulkMarkResponded = async () => {
        if (!firestore || selectedLeads.length === 0) return;

        const batch = writeBatch(firestore);
        selectedLeads.forEach(id => {
            const docRef = doc(firestore, 'leads', id);
            batch.update(docRef, { responded: true });
        });

        try {
            await batch.commit();
            toast({
                title: "Leads Atualizados",
                description: `${selectedLeads.length} leads foram marcados como 'respondeu'.`
            });
            setSelectedLeads([]);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao Atualizar",
                description: "Não foi possível atualizar os leads selecionados."
            });
        }
    };

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedMonth("none");
        setDateRange(undefined);
    };


    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Leads no Filtro</CardTitle>
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
                <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Leads que Responderam
                        </CardTitle>
                        <PhoneIncoming className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                            {isLoading ? <Skeleton className="h-8 w-12"/> : respondedLeads}
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
            
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    <div className="relative w-full max-w-sm sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar por nome ou telefone..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Select value={selectedMonth} onValueChange={(val) => { setSelectedMonth(val); setDateRange(undefined); }}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar por Mês" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Todos os meses</SelectItem>
                            {months.map(m => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                            "w-[280px] justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                {format(dateRange.from, "LLL dd, y", { locale: ptBR })} -{" "}
                                {format(dateRange.to, "LLL dd, y", { locale: ptBR })}
                                </>
                            ) : (
                                format(dateRange.from, "LLL dd, y", { locale: ptBR })
                            )
                            ) : (
                            <span>Período personalizado</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from || new Date()}
                            selected={dateRange}
                            onSelect={(range) => { setDateRange(range); setSelectedMonth("none"); }}
                            numberOfMonths={2}
                            locale={ptBR}
                        />
                        </PopoverContent>
                    </Popover>

                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                        <FilterX className="h-4 w-4 mr-2" />
                        Limpar
                    </Button>
                </div>
                
                {displayedLeads.length > 0 && searchQuery === "" && selectedMonth === "none" && !dateRange && (
                    <span className="text-xs text-muted-foreground italic">Exibindo últimos 30 leads (sem filtros ativos)</span>
                )}
            </div>

             <div className="mt-4">
                 {selectedLeads.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm text-muted-foreground">{selectedLeads.length} selecionados</span>
                        <Button variant="outline" size="sm" onClick={handleBulkMarkContacted}>
                           Marcar como contactado
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleBulkMarkResponded}>
                           Marcar como respondeu
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir selecionados
                        </Button>
                    </div>
                )}
            </div>
             <div className="flex flex-1 rounded-lg shadow-sm">
                <LeadsTable 
                    leads={displayedLeads}
                    setLeads={setLeads}
                    isLoading={isLoading}
                    selectedLeads={selectedLeads}
                    onToggleAll={handleToggleAll}
                    onToggleOne={handleToggleOne}
                />
            </div>
        </>
    );
}
