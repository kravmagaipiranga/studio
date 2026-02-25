
"use client";

import { useState, useMemo, useEffect } from "react";
import { LeadsTable } from "@/components/leads/leads-table";
import { LeadImportDialog } from "@/components/leads/lead-import-dialog";
import { Button } from "@/components/ui/button";
import { Download, Search, Phone, PhoneForwarded, PhoneOff, Upload, Trash2, PhoneIncoming, Calendar as CalendarIcon, FilterX, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Lead } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, writeBatch } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import { isWithinInterval, parseISO, startOfMonth, endOfMonth, format, startOfDay, endOfDay } from "date-fns";
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
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

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

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedMonth, dateRange]);
    
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
               } catch { return false; }
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
               } catch { return false; }
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

    // Pagination logic
    const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
    const paginatedLeads = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredLeads.slice(start, start + itemsPerPage);
    }, [filteredLeads, currentPage, itemsPerPage]);
    
    const { totalLeads, contactedLeads, pendingLeads, respondedLeads } = useMemo(() => {
        const data = filteredLeads || [];
        const total = data.length;
        const contacted = data.filter(l => l.contacted).length;
        const responded = data.filter(l => l.responded).length;
        
        return { totalLeads: total, contactedLeads: contacted, pendingLeads: total - contacted, respondedLeads: responded };
    }, [filteredLeads]);

    useEffect(() => {
        setSelectedLeads([]);
    }, [paginatedLeads]);

    const handleExportData = () => {
        if (!leads) return;
        const headers = ["Data Contato", "Nome", "Telefone", "Contactado", "Respondeu"];
        const csvContent = [headers.join(','), ...leads.map(l => [l.contactDate, l.name, l.phone, l.contacted, !!l.responded].join(','))].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', 'export_leads.csv');
        link.click();
    };

    const handleToggleAll = () => {
        if (selectedLeads.length === paginatedLeads.length) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(paginatedLeads.map(l => l.id));
        }
    };

    const handleToggleOne = (leadId: string) => {
        setSelectedLeads(prev => prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]);
    };

    const handleBulkDelete = async () => {
        if (!firestore || selectedLeads.length === 0) return;
        const batch = writeBatch(firestore);
        selectedLeads.forEach(id => batch.delete(doc(firestore, 'leads', id)));
        await batch.commit();
        setSelectedLeads([]);
        toast({ title: "Leads Excluídos" });
    };
    
    const handleBulkMarkContacted = async () => {
        if (!firestore || selectedLeads.length === 0) return;
        const batch = writeBatch(firestore);
        selectedLeads.forEach(id => batch.update(doc(firestore, 'leads', id), { contacted: true }));
        await batch.commit();
        setSelectedLeads([]);
        toast({ title: "Leads Atualizados" });
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            
            <div className="flex flex-wrap items-center justify-between gap-4">
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
                            {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Popover>
                        <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-[280px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd, y", { locale: ptBR })} - {format(dateRange.to, "LLL dd, y", { locale: ptBR })}</> : format(dateRange.from, "LLL dd, y", { locale: ptBR })) : <span>Período personalizado</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                        <Calendar initialFocus mode="range" defaultMonth={dateRange?.from || new Date()} selected={dateRange} onSelect={(range) => { setDateRange(range); setSelectedMonth("none"); }} numberOfMonths={2} locale={ptBR} />
                        </PopoverContent>
                    </Popover>

                    <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(""); setSelectedMonth("none"); setDateRange(undefined); }} className="text-muted-foreground">
                        <FilterX className="h-4 w-4 mr-2" /> Limpar
                    </Button>
                </div>
            </div>

             <Card className="flex flex-col shadow-sm">
                <CardContent className="p-0">
                    {selectedLeads.length > 0 && (
                        <div className="p-4 flex items-center gap-2 border-b bg-muted/50">
                            <span className="text-sm text-muted-foreground">{selectedLeads.length} selecionados</span>
                            <Button variant="outline" size="sm" onClick={handleBulkMarkContacted}>Marcar contactado</Button>
                            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>Excluir</Button>
                        </div>
                    )}
                    <LeadsTable 
                        leads={paginatedLeads}
                        setLeads={setLeads}
                        isLoading={isLoading}
                        selectedLeads={selectedLeads}
                        onToggleAll={handleToggleAll}
                        onToggleOne={handleToggleOne}
                    />
                    
                    {!isLoading && filteredLeads.length > 0 && (
                        <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
                            <div className="text-sm text-muted-foreground">
                                Mostrando <strong>{Math.min(filteredLeads.length, (currentPage - 1) * itemsPerPage + 1)}</strong> a <strong>{Math.min(filteredLeads.length, currentPage * itemsPerPage)}</strong> de <strong>{filteredLeads.length}</strong> leads
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
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="text-xs font-medium px-2">Página {currentPage} de {totalPages}</div>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
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
