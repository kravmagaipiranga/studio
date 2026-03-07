
"use client";

import { useState, useMemo, useEffect } from "react";
import { CompaniesTable } from "@/components/companies/companies-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search, Building2, DollarSign, CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Company } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EmpresasPage() {
    const firestore = useFirestore();
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
        return query(collection(firestore, 'companies'), orderBy('createdAt', 'desc'));
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

    const filteredCompanies = useMemo(() => {
        return (companies || []).filter(company =>
            company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (company.cnpj && company.cnpj.includes(searchQuery)) ||
            (company.contactName && company.contactName.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [companies, searchQuery]);

    // Pagination logic
    const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
    const paginatedCompanies = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredCompanies.slice(start, start + itemsPerPage);
    }, [filteredCompanies, currentPage, itemsPerPage]);

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
            <div className="grid gap-4 md:grid-cols-3">
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

            <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Clientes Corporativos</h1>
                <div className="flex items-center gap-2">
                    <Button onClick={handleAddNewCompany}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Novo Cliente Empresa
                    </Button>
                    <Button variant="outline">
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
                    
                    {!isLoading && filteredCompanies.length > 0 && (
                        <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
                            <div className="text-sm text-muted-foreground">
                                Mostrando <strong>{Math.min(filteredCompanies.length, (currentPage - 1) * itemsPerPage + 1)}</strong> a <strong>{Math.min(filteredCompanies.length, currentPage * itemsPerPage)}</strong> de <strong>{filteredCompanies.length}</strong> empresas
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
