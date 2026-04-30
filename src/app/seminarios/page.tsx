
"use client";

import { useState, useEffect, useMemo } from "react";
import { SeminarsTable } from "@/components/seminars/seminars-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Seminar, Student } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { downloadCSV } from "@/lib/export-csv";

export default function SeminariosPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [seminars, setSeminars] = useState<Seminar[]>([]);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const seminarsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'seminars');
    }, [firestore]);
    
    const studentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'students');
    }, [firestore]);

    const { data: initialSeminars, isLoading: isLoadingSeminars } = useCollection<Seminar>(seminarsCollection);
    const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsCollection);

    useEffect(() => {
        if (initialSeminars) {
            setSeminars(initialSeminars);
        }
    }, [initialSeminars]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const filteredSeminars = useMemo(() => {
        return (seminars || []).filter(seminar =>
            seminar.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            seminar.topic.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [seminars, searchQuery]);

    // Pagination logic
    const totalPages = Math.ceil(filteredSeminars.length / itemsPerPage);
    const paginatedSeminars = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredSeminars.slice(start, start + itemsPerPage);
    }, [filteredSeminars, currentPage, itemsPerPage]);

    const handleExportData = () => {
        if (!filteredSeminars || filteredSeminars.length === 0) {
            toast({
                variant: "destructive",
                title: "Nenhum dado para exportar",
                description: "A seleção de filtros atual não retornou nenhum registro.",
            });
            return;
        }
        const headers = [
            "ID", "Tópico", "ID Aluno", "Nome do Aluno", "Faixa", "CPF", "Idade",
            "Status Pagamento", "Data Pagamento", "Valor", "Forma de Pagamento"
        ];
        const rows = filteredSeminars.map(s => [
            s.id, s.topic, s.studentId, s.studentName, s.studentBelt, s.studentCpf, s.studentAge,
            s.paymentStatus, s.paymentDate ?? '', s.paymentAmount, s.paymentMethod
        ]);
        downloadCSV('export_seminarios', headers, rows);
        toast({
            title: "Exportação concluída!",
            description: `${filteredSeminars.length} registros foram exportados.`,
        });
    };

    const handleAddNewSeminar = () => {
       const newSeminar: Seminar = {
         id: `new_${uuidv4()}`,
         topic: "",
         studentId: "",
         studentName: "",
         studentBelt: "",
         studentCpf: "",
         studentAge: 0,
         paymentStatus: "Pendente",
         paymentAmount: 100,
         paymentMethod: "Pendente",
         isNew: true,
       };
       setSeminars(prev => [newSeminar, ...prev]);
    };

    const isLoading = isLoadingSeminars || isLoadingStudents;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Seminários e Cursos</h1>
                <div className="flex items-center gap-2">
                    <Button onClick={handleAddNewSeminar}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nova Inscrição
                    </Button>
                    <Button variant="outline" onClick={handleExportData}>
                        <Download className="mr-2 h-4 w-4" />
                        Gerar Relatório
                    </Button>
                </div>
            </div>
            <div className="flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por aluno ou tema..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <DatePickerWithRange />
            </div>
             <Card className="flex flex-col shadow-sm">
                <CardContent className="p-0">
                    <SeminarsTable 
                        seminars={paginatedSeminars}
                        setSeminars={setSeminars}
                        allStudents={students || []}
                        isLoading={isLoading}
                    />
                    
                    {!isLoading && filteredSeminars.length > 0 && (
                        <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
                            <div className="text-sm text-muted-foreground">
                                Mostrando <strong>{Math.min(filteredSeminars.length, (currentPage - 1) * itemsPerPage + 1)}</strong> a <strong>{Math.min(filteredSeminars.length, currentPage * itemsPerPage)}</strong> de <strong>{filteredSeminars.length}</strong> inscrições
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
