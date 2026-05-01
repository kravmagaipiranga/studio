
"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { collection, query, where, doc } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { Student, Attendance, HandbookContent, TaughtTechnique } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO, startOfMonth, endOfMonth, isSaturday, eachWeekOfInterval } from "date-fns";
import { CheckSquare, Trash2, UserCheck, Clock, UserPlus, Info, TrendingDown, Users, BookOpen, GraduationCap, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

const BELTS = [
  { id: 'branca', name: 'Faixa Branca (Iniciante)', color: '#e2e8f0' },
  { id: 'amarela', name: 'Faixa Amarela', color: '#fbbf24' },
  { id: 'laranja', name: 'Faixa Laranja', color: '#f97316' },
  { id: 'verde', name: 'Faixa Verde', color: '#22c55e' },
  { id: 'azul', name: 'Faixa Azul', color: '#3b82f6' },
  { id: 'marrom', name: 'Faixa Marrom', color: '#78350f' },
  { id: 'preta', name: 'Faixa Preta', color: '#0f172a' },
];

const beltColors: Record<string, string> = {
  'Branca': '#e2e8f0',
  'Amarela': '#fbbf24',
  'Laranja': '#f97316',
  'Verde': '#22c55e',
  'Azul': '#3b82f6',
  'Marrom': '#78350f',
  'Preta': '#0f172a',
};

function ChamadaContent() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  // State for tabs and initial filters
  const [activeTab, setActiveTab] = useState("diario");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [classDate, setClassDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [classTime, setClassTime] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for Taught Technique
  const [selectedBeltId, setSelectedBeltId] = useState("");
  const [selectedTechnique, setSelectedTechnique] = useState("");
  const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);

  // State for report filter
  const [reportStartDate, setReportStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [reportEndDate, setReportEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [reportBeltFilter, setReportBeltFilter] = useState("todos");
  const [reportStudentFilter, setReportStudentFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Sync from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'relatorio') setActiveTab('relatorio');

    const searchParam = searchParams.get('search');
    if (searchParam) setSearchQuery(searchParam);

    const startParam = searchParams.get('startDate');
    const endParam = searchParams.get('endDate');
    if (startParam) setReportStartDate(startParam);
    if (endParam) setReportEndDate(endParam);

    // Backwards compat: old month/year URL params
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');
    if (monthParam && yearParam && !startParam) {
      const y = Number(yearParam);
      const m = Number(monthParam) - 1;
      setReportStartDate(format(startOfMonth(new Date(y, m)), "yyyy-MM-dd"));
      setReportEndDate(format(endOfMonth(new Date(y, m)), "yyyy-MM-dd"));
    }
  }, [searchParams]);

  // Determine class options based on date
  const classOptions = useMemo(() => {
    try {
      const dateObj = parseISO(classDate);
      if (isSaturday(dateObj)) {
        return ["9h", "10h30"];
      }
      return ["18h", "19h", "20h"];
    } catch {
      return ["18h", "19h", "20h"];
    }
  }, [classDate]);

  // Sync selected class if it becomes invalid after date change
  useEffect(() => {
    if (!classOptions.includes(classTime)) {
      setClassTime(classOptions[0]);
    }
  }, [classOptions, classTime]);

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, reportStartDate, reportEndDate, reportBeltFilter, reportStudentFilter]);

  // Data fetching
  const studentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "students"), where("status", "==", "Ativo"));
  }, [firestore]);

  const { data: rawStudents, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);

  const students = useMemo(() => {
    if (!rawStudents) return [];
    return [...rawStudents].sort((a, b) => a.name.localeCompare(b.name));
  }, [rawStudents]);

  const todayQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "attendance"),
      where("date", "==", classDate)
    );
  }, [firestore, classDate]);

  const { data: rawTodayAttendance, isLoading: isLoadingToday } = useCollection<Attendance>(todayQuery);

  const todayAttendance = useMemo(() => {
    if (!rawTodayAttendance) return [];
    return [...rawTodayAttendance].sort((a, b) => a.time.localeCompare(b.time, undefined, { numeric: true }));
  }, [rawTodayAttendance]);

  // Handbook fetching for techniques
  const handbookQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'handbook');
  }, [firestore]);

  const { data: dbHandbook } = useCollection<HandbookContent>(handbookQuery);

  const availableTechniques = useMemo(() => {
    if (!dbHandbook || !selectedBeltId) return [];
    const beltData = dbHandbook.find(h => h.id === selectedBeltId);
    return beltData?.techniques || [];
  }, [dbHandbook, selectedBeltId]);

  const taughtTopicsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, "taughtTechniques"),
        where("date", "==", classDate)
    );
  }, [firestore, classDate]);

  const { data: rawTaughtTopics, isLoading: isLoadingTopics } = useCollection<TaughtTechnique>(taughtTopicsQuery);

  const taughtTopics = useMemo(() => {
    if (!rawTaughtTopics) return [];
    return [...rawTaughtTopics].sort((a, b) => {
        try {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } catch (e) {
            return 0;
        }
    });
  }, [rawTaughtTopics]);

  const reportQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "attendance"),
      where("date", ">=", reportStartDate),
      where("date", "<=", reportEndDate)
    );
  }, [firestore, reportStartDate, reportEndDate]);

  const { data: monthAttendance, isLoading: isLoadingReport } = useCollection<Attendance>(reportQuery);

  const studentOptions = useMemo(() => 
    (students || []).map(s => ({ value: s.id, label: s.name })), 
  [students]);

  const handleRecordAttendance = async (category: 'Aluno' | 'Visita' | 'Experiência' = 'Aluno') => {
    if (!firestore) return;

    if (category === 'Aluno' && !selectedStudentId) {
      toast({ variant: "destructive", title: "Erro", description: "Selecione um aluno." });
      return;
    }

    setIsSubmitting(true);
    const dateObj = parseISO(classDate);
    const type = isSaturday(dateObj) ? "Sábado" : "Semanal";

    let studentName = "";
    let studentId = "";

    if (category === 'Aluno') {
        const student = students?.find(s => s.id === selectedStudentId);
        if (!student) return;
        studentName = student.name;
        studentId = student.id;
    } else {
        studentName = category === 'Visita' ? "Visita" : "Aula Experimental";
        studentId = category.toUpperCase(); 
    }

    const attendanceData: Omit<Attendance, 'id'> = {
      studentId,
      studentName,
      date: classDate,
      time: classTime,
      type,
      category,
      createdAt: new Date().toISOString(),
    };

    try {
      await addDocumentNonBlocking(collection(firestore, "attendance"), attendanceData);
      toast({ title: "Registro Realizado!", description: `${studentName} na turma das ${classTime}.` });
      if (category === 'Aluno') setSelectedStudentId("");
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao registrar", description: "Tente novamente." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordTechnique = async () => {
    if (!firestore || !selectedBeltId || !selectedTechnique) {
        toast({ variant: "destructive", title: "Erro", description: "Selecione a graduação e a matéria." });
        return;
    }

    setIsSubmittingTopic(true);
    const beltName = BELTS.find(b => b.id === selectedBeltId)?.name || "";

    const topicData: Omit<TaughtTechnique, 'id'> = {
        date: classDate,
        time: classTime,
        beltId: selectedBeltId,
        beltName,
        technique: selectedTechnique,
        createdAt: new Date().toISOString(),
    };

    try {
        await addDocumentNonBlocking(collection(firestore, "taughtTechniques"), topicData);
        toast({ title: "Matéria Registrada!", description: `Matéria da ${beltName} salva.` });
        setSelectedTechnique("");
    } catch (error) {
        toast({ variant: "destructive", title: "Erro ao registrar matéria." });
    } finally {
        setIsSubmittingTopic(false);
    }
  };

  const handleDeleteAttendance = (id: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, "attendance", id));
    toast({ title: "Registro Removido" });
  };

  const handleDeleteTopic = (id: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, "taughtTechniques", id));
    toast({ title: "Matéria Removida" });
  };

  const fullReportData = useMemo(() => {
    if (!students || !monthAttendance) return [];

    const start = parseISO(reportStartDate);
    const end = parseISO(reportEndDate);
    const weeksInPeriod = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).length;

    const data = students.map(student => {
      const attendances = monthAttendance.filter(a => a.studentId === student.id);
      const count = attendances.reduce((acc, a) => acc + (a.type === "Sábado" ? 2 : 1), 0);
      const hasSaturday = attendances.some(a => a.type === "Sábado");
      const target = hasSaturday ? weeksInPeriod : (weeksInPeriod * 2);
      const deficit = Math.max(0, target - count);

      return {
        id: student.id,
        name: student.name,
        count,
        target,
        absences: deficit,
        belt: student.belt,
      };
    });

    return data;
  }, [students, monthAttendance, reportStartDate, reportEndDate]);

  const filteredReportData = useMemo(() => {
    let filtered = fullReportData;

    if (reportBeltFilter !== 'todos') {
      filtered = filtered.filter(d => d.belt?.toLowerCase() === reportBeltFilter.toLowerCase());
    }
    if (reportStudentFilter) {
      filtered = filtered.filter(d => d.id === reportStudentFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [fullReportData, reportBeltFilter, reportStudentFilter, searchQuery]);

  const classEngagementData = useMemo(() => {
    if (!monthAttendance) return [];
    const counts: Record<string, number> = {};
    monthAttendance.forEach(a => {
      if (a.time) counts[a.time] = (counts[a.time] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthAttendance]);

  const absencesByBelt = useMemo(() => {
    if (fullReportData.length === 0) return [];
    const belts = ['Branca', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Marrom', 'Preta'];
    return belts.map(belt => {
      const studentsInBelt = fullReportData.filter(d => d.belt === belt && d.absences > 0);
      if (studentsInBelt.length === 0) return null;
      return {
        belt,
        students: studentsInBelt.sort((a, b) => b.absences - a.absences).slice(0, 5)
      };
    }).filter(Boolean);
  }, [fullReportData]);

  const totalPages = Math.ceil(filteredReportData.length / itemsPerPage);
  const paginatedReportData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReportData.slice(start, start + itemsPerPage);
  }, [filteredReportData, currentPage, itemsPerPage]);

  const applyPeriodPreset = (preset: 'este-mes' | 'mes-passado' | 'ultimos-30') => {
    const now = new Date();
    if (preset === 'este-mes') {
      setReportStartDate(format(startOfMonth(now), "yyyy-MM-dd"));
      setReportEndDate(format(endOfMonth(now), "yyyy-MM-dd"));
    } else if (preset === 'mes-passado') {
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      setReportStartDate(format(startOfMonth(last), "yyyy-MM-dd"));
      setReportEndDate(format(endOfMonth(last), "yyyy-MM-dd"));
    } else if (preset === 'ultimos-30') {
      const from = new Date(now);
      from.setDate(now.getDate() - 30);
      setReportStartDate(format(from, "yyyy-MM-dd"));
      setReportEndDate(format(now, "yyyy-MM-dd"));
    }
  };

  const hasActiveFilters = reportBeltFilter !== 'todos' || reportStudentFilter !== '' || searchQuery !== '';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CheckSquare className="h-6 w-6 text-primary" />
          Controle de Presença
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="diario">Registro Diário</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório de Faltas</TabsTrigger>
        </TabsList>

        <TabsContent value="diario" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Marcar Presença</CardTitle>
              <CardDescription>Selecione o aluno ou registre um interessado na turma.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium">Aluno</label>
                  <Combobox
                    options={studentOptions}
                    value={selectedStudentId}
                    onChange={setSelectedStudentId}
                    placeholder="Selecione o aluno..."
                    searchPlaceholder="Buscar por nome..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data</label>
                  <Input type="date" value={classDate} onChange={e => setClassDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Turma</label>
                  <Select value={classTime} onValueChange={setClassTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {classOptions.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button onClick={() => handleRecordAttendance('Aluno')} disabled={isSubmitting || !selectedStudentId}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Registrar Presença
                </Button>
                
                <div className="h-8 w-px bg-border mx-2 hidden sm:block" />
                
                <Button variant="outline" onClick={() => handleRecordAttendance('Experiência')} disabled={isSubmitting} className="border-blue-200 hover:bg-blue-50 text-blue-700">
                  <UserPlus className="mr-2 h-4 w-4" />
                  + Aula Experimental
                </Button>
                
                <Button variant="outline" onClick={() => handleRecordAttendance('Visita')} disabled={isSubmitting} className="border-orange-200 hover:bg-orange-50 text-orange-700">
                  <Info className="mr-2 h-4 w-4" />
                  + Visita
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Registros de Presença: {format(parseISO(classDate), "dd/MM/yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pessoa / Aluno</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingToday ? (
                    <TableRow><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                  ) : todayAttendance && todayAttendance.length > 0 ? (
                    todayAttendance.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.studentName}</TableCell>
                        <TableCell>{a.time}</TableCell>
                        <TableCell>
                            <span className={cn(
                                "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                                a.category === 'Visita' ? "bg-orange-100 text-orange-700" :
                                a.category === 'Experiência' ? "bg-blue-100 text-blue-700" :
                                "bg-muted text-muted-foreground"
                            )}>
                                {a.category || 'Aluno'}
                            </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteAttendance(a.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                        Nenhum registro para esta data ainda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Registro de Matéria Ensinada */}
          <Card className="border-blue-100">
            <CardHeader className="bg-blue-50/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Matérias Ensinadas no Dia
              </CardTitle>
              <CardDescription>Registre os temas técnicos abordados em aula conforme a apostila.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Graduação (Filtro Apostila)</label>
                        <Select value={selectedBeltId} onValueChange={setSelectedBeltId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a faixa..." />
                            </SelectTrigger>
                            <SelectContent>
                                {BELTS.map(belt => (
                                    <SelectItem key={belt.id} value={belt.id}>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: belt.color }} />
                                            {belt.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium">Técnica ensinada</label>
                        <Select value={selectedTechnique} onValueChange={setSelectedTechnique} disabled={!selectedBeltId}>
                            <SelectTrigger>
                                <SelectValue placeholder={selectedBeltId ? "Escolha a técnica da apostila..." : "Selecione a faixa primeiro"} />
                            </SelectTrigger>
                            <SelectContent>
                                {availableTechniques.length > 0 ? (
                                    availableTechniques.map((tech, idx) => (
                                        <SelectItem key={idx} value={tech}>{tech}</SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="none" disabled>Nenhuma técnica cadastrada</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleRecordTechnique} disabled={isSubmittingTopic || !selectedTechnique} className="bg-blue-600 hover:bg-blue-700">
                        <GraduationCap className="mr-2 h-4 w-4" />
                        Registrar Matéria
                    </Button>
                </div>

                <div className="border rounded-lg overflow-hidden mt-4">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[150px]">Graduação</TableHead>
                                <TableHead>Técnica / Exercício</TableHead>
                                <TableHead className="w-[100px]">Horário</TableHead>
                                <TableHead className="text-right w-[80px]">Ação</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingTopics ? (
                                <TableRow><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                            ) : taughtTopics && taughtTopics.length > 0 ? (
                                taughtTopics.map((topic) => (
                                    <TableRow key={topic.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2 font-bold text-[10px] uppercase">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: beltColors[topic.beltName.replace('Faixa ', '').split(' (')[0]] || '#ccc' }} />
                                                {topic.beltName}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">{topic.technique}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{topic.time}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTopic(topic.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-20 text-muted-foreground italic">
                                        Nenhuma matéria registrada para este dia.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorio" className="space-y-6 pt-4">
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                Filtros do Relatório
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Period */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Período</label>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => applyPeriodPreset('este-mes')}>Este mês</Button>
                  <Button size="sm" variant="outline" onClick={() => applyPeriodPreset('mes-passado')}>Mês passado</Button>
                  <Button size="sm" variant="outline" onClick={() => applyPeriodPreset('ultimos-30')}>Últimos 30 dias</Button>
                  <div className="flex items-center gap-2 ml-2">
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-muted-foreground whitespace-nowrap">De:</label>
                      <Input
                        type="date"
                        value={reportStartDate}
                        onChange={e => setReportStartDate(e.target.value)}
                        className="h-8 w-36 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-muted-foreground whitespace-nowrap">Até:</label>
                      <Input
                        type="date"
                        value={reportEndDate}
                        onChange={e => setReportEndDate(e.target.value)}
                        className="h-8 w-36 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Belt + Student + Text Search */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" /> Graduação
                  </label>
                  <Select value={reportBeltFilter} onValueChange={setReportBeltFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas as faixas</SelectItem>
                      {BELTS.map(belt => (
                        <SelectItem key={belt.id} value={belt.id}>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: belt.color }} />
                            {belt.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5" /> Aluno específico
                  </label>
                  <Combobox
                    options={[{ value: '', label: 'Todos os alunos' }, ...studentOptions]}
                    value={reportStudentFilter}
                    onChange={setReportStudentFilter}
                    placeholder="Todos os alunos"
                    searchPlaceholder="Buscar aluno..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Search className="h-3.5 w-3.5" /> Busca por nome
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar no relatório..."
                      className="pl-8 h-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">Filtros ativos:</span>
                  {reportBeltFilter !== 'todos' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {BELTS.find(b => b.id === reportBeltFilter)?.name}
                    </span>
                  )}
                  {reportStudentFilter && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                      {studentOptions.find(s => s.value === reportStudentFilter)?.label}
                    </span>
                  )}
                  {searchQuery && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      "{searchQuery}"
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs text-muted-foreground"
                    onClick={() => {
                      setReportBeltFilter('todos');
                      setReportStudentFilter('');
                      setSearchQuery('');
                    }}
                  >
                    Limpar filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Resumo do Período</h2>
              <p className="text-sm text-muted-foreground">
                {format(parseISO(reportStartDate), "dd/MM/yyyy")} — {format(parseISO(reportEndDate), "dd/MM/yyyy")}
                {' · '}{filteredReportData.length} aluno{filteredReportData.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" /> Engajamento por Turma
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  {isLoadingReport ? (
                    <Skeleton className="h-full w-full" />
                  ) : classEngagementData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classEngagementData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          formatter={(value) => [value, "Presenças"]}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {classEngagementData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="#2563eb" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground italic">Sem dados neste período.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" /> Alunos com Mais Faltas por Faixa
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[250px]">
                  <div className="p-4 space-y-6">
                    {isLoadingReport ? (
                      <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : absencesByBelt.length > 0 ? (
                      absencesByBelt.map((group: any) => (
                        <div key={group.belt} className="space-y-2">
                          <h4 className="text-xs font-black uppercase flex items-center gap-2" style={{ color: beltColors[group.belt] || 'inherit' }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: beltColors[group.belt] || '#ccc' }} />
                            Faixa {group.belt}
                          </h4>
                          <div className="space-y-1">
                            {group.students.map((s: any) => (
                              <div key={s.id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                                <span className="font-medium">{s.name}</span>
                                <span className="font-bold text-destructive">{s.absences} faltas</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-muted-foreground italic">Parabéns! Todos os alunos estão em dia.</div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" /> Frequência por Aluno
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {filteredReportData.length} aluno{filteredReportData.length !== 1 ? 's' : ''}
                  {filteredReportData.filter(d => d.absences > 0).length > 0 && (
                    <> · <span className="text-red-600 font-semibold">{filteredReportData.filter(d => d.absences > 0).length} com falta{filteredReportData.filter(d => d.absences > 0).length !== 1 ? 's' : ''}</span></>
                  )}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Faixa</TableHead>
                    <TableHead className="text-center">Aulas (Peso Sáb.)</TableHead>
                    <TableHead className="text-center">Meta Mensal</TableHead>
                    <TableHead className="text-center">Faltas Est.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingReport || isLoadingStudents ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                    ))
                  ) : paginatedReportData.length > 0 ? (
                    paginatedReportData.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: beltColors[d.belt] || '#ccc' }} />
                            {d.belt}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold text-blue-600">{d.count}</TableCell>
                        <TableCell className="text-center text-muted-foreground">{d.target}</TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            "font-bold px-2 py-1 rounded",
                            d.absences > 3 ? "bg-red-100 text-red-700" : d.absences > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                          )}>
                            {d.absences}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                        Nenhum dado para exibir.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {!isLoadingReport && !isLoadingStudents && filteredReportData.length > 0 && (
                <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
                    <div className="text-sm text-muted-foreground">
                        Mostrando <strong>{Math.min(filteredReportData.length, (currentPage - 1) * itemsPerPage + 1)}</strong> a <strong>{Math.min(filteredReportData.length, currentPage * itemsPerPage)}</strong> de <strong>{filteredReportData.length}</strong> alunos
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

              <div className="px-4 pb-4 space-y-1">
                <p className="text-[10px] text-muted-foreground italic">
                  * A meta mensal é baseada em 2 aulas/semana ou 1 aula/sábado.
                </p>
                <p className="text-[10px] text-blue-600 font-bold italic">
                  * Aulas de Sábado possuem peso 2 no total de aulas realizadas.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ScrollArea({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={cn("overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20", className)}>
            {children}
        </div>
    );
}

export default function ChamadaPage() {
  return (
    <Suspense fallback={<Skeleton className="h-screen w-full" />}>
      <ChamadaContent />
    </Suspense>
  );
}
