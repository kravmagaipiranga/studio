
"use client";

import { useState, useMemo, useEffect } from "react";
import { CompaniesTable } from "@/components/companies/companies-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search, Building2, DollarSign, CalendarRange, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Company } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, format, isAfter, isSameDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { downloadCSV } from "@/lib/export-csv";

export default function EmpresasPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isMounted, setIsMounted] = useState(false);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const companiesCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'companies');
    }, [firestore]);

    const { data: initialCompanies, isLoading: isLoadingCollection } = useCollection<Company>(companiesCollection);

    const isLoading = isLoadingCollection || !isMounted;

    useEffect(() => {
        if (initialCompanies) {
            setCompanies(initialCompanies);
        }
    }, [initialCompanies]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const metrics = useMemo(() => {
        if (!companies || !isMounted) return { total: 0, revenueThisMonth: 0, pendingCount: 0 };
    
        const today = new Date();
        const start = startOfMonth(today);
        const end = endOfMonth(today);
        
        let revenue = 0;
        let pending = 0;

        companies.forEach(company => {
            if (company.paymentStatus === 'Pago' && company.paymentDate) {
                try {
                    const pDate = parseISO(company.paymentDate);
                    if (isWithinInterval(pDate, { start, end })) {
                        revenue += company.value || 0;
                    }
                } catch (e) {}
            }
            if (company.paymentStatus === 'Pendente') {
                pending++;
            }
        });

        return { total: companies.length, revenueThisMonth: revenue, pendingCount: pending };
    }, [companies, isMounted]);

    // Próximos eventos para a lista de agenda
    const upcomingEvents = useMemo(() => {
        if (!companies) return [];
        const today = startOfDay(new Date());
        
        return companies
            .filter(c => {
                if (!c.eventDate) return false;
                const eDate = parseISO(c.eventDate);
                return isAfter(eDate, today) || isSameDay(eDate, today);
            })
            .sort((a, b) => a.eventDate!.localeCompare(b.eventDate!));
    }, [companies]);

    const filteredAndSortedCompanies = useMemo(() => {
        const filtered = (companies || []).filter(company =>
            company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (company.cnpj && company.cnpj.includes(searchQuery)) ||
            (company.contactName && company.contactName.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        // Ordenação por data do evento (mais recentes primeiro)
        return filtered.sort((a, b) => {
            if (!a.eventDate) return 1;
            if (!b.eventDate) return -1;
            return b.eventDate.localeCompare(a.eventDate);
        });
    }, [companies, searchQuery]);

    // Pagination logic
    const totalPages = Math.ceil(filteredAndSortedCompanies.length / itemsPerPage);
    const paginatedCompanies = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedCompanies.slice(start, start + itemsPerPage);
    }, [filteredAndSortedCompanies, currentPage, itemsPerPage]);

    const handleExportData = () => {
        if (!filteredAndSortedCompanies || filteredAndSortedCompanies.length === 0) {
            toast({
                variant: "destructive",
                title: "Nenhum dado para exportar",
                description: "A seleção de filtros atual não retornou nenhum registro.",
            });
            return;
        }
        const headers = [
            "ID", "Nome", "CNPJ", "Contato", "Telefone", "Email", "Endereço",
            "Tipo de Trabalho", "Data do Evento", "Hora do Evento",
            "Valor", "Data Pagamento", "Forma de Pagamento", "Status Pagamento",
            "Observações", "Criado em"
        ];
        const rows = filteredAndSortedCompanies.map(c => [
            c.id, c.name, c.cnpj ?? '', c.contactName ?? '', c.contactPhone ?? '',
            c.contactEmail ?? '', c.address ?? '',
            c.workType, c.eventDate ?? '', c.eventTime ?? '',
            c.value, c.paymentDate ?? '', c.paymentMethod, c.paymentStatus,
            c.notes ?? '', c.createdAt
        ]);
        downloadCSV('export_empresas', headers, rows);
        toast({
            title: "Exportação concluída!",
            description: `${filteredAndSortedCompanies.length} registros foram exportados.`,
        });
    };

    const handleAddNewCompany = () => {
       const newCompany: Company = {
         id: `new_${uuidv4()}`,
         name: "",
         cnpj: "",
         contactName: "",
         contactPhone: "",
         contactEmail: "",
         address: "",
         eventDate: new Date().toISOString().split('T')[0],
         eventTime: "09:00",
         workType: "Palestra",
         value: 0,
         paymentMethod: "Pendente",
         paymentStatus: "Pendente",
         notes: "",
         createdAt: new Date().toISOString(),
         isNew: true,
       };
       setCompanies(prev => [newCompany, ...prev]);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-12">
                <div className="md:col-span-8 grid gap-4 sm:grid-cols-3">
                    <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                Empresas Atendidas
                            </CardTitle>
                            <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                {isLoading ? <Skeleton className="h-8 w-12"/> : metrics.total}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                                Receita Corporativa (Mês)
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                                {isLoading ? <Skeleton className="h-8 w-24"/> : `R$ ${metrics.revenueThisMonth.toFixed(2)}`}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                Pagamentos Pendentes
                            </CardTitle>
                            <CalendarRange className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                                {isLoading ? <Skeleton className="h-8 w-12"/> : metrics.pendingCount}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <Card className="md:col-span-4 border-primary/10 shadow-sm flex flex-col h-full">
                    <CardHeader className="p-4 pb-2 border-b shrink-0">
                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2 tracking-widest">
                            <CalendarIcon className="h-3 w-3" /> Agenda de Eventos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-hidden">
                        <ScrollArea className="h-[250px]">
                            {isLoading ? (
                                <div className="p-4 space-y-2">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ) : upcomingEvents.length > 0 ? (
                                <div className="divide-y">
                                    {upcomingEvents.map((event) => (
                                        <div key={event.id} className="p-3 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-bold text-blue-600 uppercase">
                                                    {format(parseISO(event.eventDate!), "dd 'de' MMM", { locale: ptBR })}
                                                </span>
                                                <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    {event.eventTime || '--:--'}
                                                </div>
                                            </div>
                                            <p className="text-xs font-black truncate text-primary">{event.name}</p>
                                            <p className="text-[9px] text-muted-foreground truncate uppercase tracking-tighter">{event.workType}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground italic text-xs">
                                    Nenhum evento agendado.
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Clientes Corporativos</h1>
                <div className="flex items-center gap-2">
                    <Button onClick={handleAddNewCompany}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Novo Cliente Empresa
                    </Button>
                    <Button variant="outline" onClick={handleExportData}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                </div>
            </div>

            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar por nome, contato ou CNPJ..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

             <Card className="flex flex-col shadow-sm">
                <CardContent className="p-0">
                    <CompaniesTable 
                        companies={paginatedCompanies}
                        setCompanies={setCompanies}
                        isLoading={isLoading}
                    />
                    
                    {!isLoading && filteredAndSortedCompanies.length > 0 && (
                        <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
                            <div className="text-sm text-muted-foreground">
                                Mostrando <strong>{Math.min(filteredAndSortedCompanies.length, (currentPage - 1) * itemsPerPage + 1)}</strong> a <strong>{Math.min(filteredAndSortedCompanies.length, currentPage * itemsPerPage)}</strong> de <strong>{filteredAndSortedCompanies.length}</strong> empresas
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
