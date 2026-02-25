
"use client";

import { useState, useMemo } from "react";
import { collection, query, where, orderBy, doc, limit } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { Student, Attendance } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO, startOfDay, endOfDay, startOfMonth, endOfMonth, isSaturday, eachWeekOfInterval, getWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckSquare, Trash2, Calendar as CalendarIcon, UserCheck, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChamadaPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // State for form
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [classDate, setClassDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [classTime, setClassTime] = useState(format(new Date(), "HH:mm"));
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for report filter
  const [reportMonth, setReportMonth] = useState(format(new Date(), "MM"));
  const [reportYear, setReportYear] = useState(format(new Date(), "yyyy"));
  const [searchQuery, setSearchQuery] = useState("");

  // Data fetching
  const studentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "students"), where("status", "==", "Ativo"), orderBy("name", "asc"));
  }, [firestore]);

  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);

  const todayQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const start = startOfDay(new Date());
    const end = endOfDay(new Date());
    return query(
      collection(firestore, "attendance"),
      where("date", "==", format(new Date(), "yyyy-MM-dd")),
      orderBy("time", "desc")
    );
  }, [firestore]);

  const { data: todayAttendance, isLoading: isLoadingToday } = useCollection<Attendance>(todayQuery);

  const reportQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const monthStart = format(startOfMonth(new Date(Number(reportYear), Number(reportMonth) - 1)), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(new Date(Number(reportYear), Number(reportMonth) - 1)), "yyyy-MM-dd");
    
    // We fetch everything from that month. For large datasets, we'd need to paginate.
    return query(
      collection(firestore, "attendance"),
      where("date", ">=", monthStart),
      where("date", "<=", monthEnd),
      orderBy("date", "desc")
    );
  }, [firestore, reportMonth, reportYear]);

  const { data: monthAttendance, isLoading: isLoadingReport } = useCollection<Attendance>(reportQuery);

  const studentOptions = useMemo(() => 
    (students || []).map(s => ({ value: s.id, label: s.name })), 
  [students]);

  const handleRecordAttendance = async () => {
    if (!firestore || !selectedStudentId) {
      toast({ variant: "destructive", title: "Erro", description: "Selecione um aluno." });
      return;
    }

    const student = students?.find(s => s.id === selectedStudentId);
    if (!student) return;

    setIsSubmitting(true);
    const dateObj = parseISO(classDate);
    const type = isSaturday(dateObj) ? "Sábado" : "Semanal";

    const attendanceData: Omit<Attendance, 'id'> = {
      studentId: student.id,
      studentName: student.name,
      date: classDate,
      time: classTime,
      type,
      createdAt: new Date().toISOString(),
    };

    try {
      await addDocumentNonBlocking(collection(firestore, "attendance"), attendanceData);
      toast({ title: "Presença Registrada!", description: `${student.name} marcado como presente.` });
      setSelectedStudentId("");
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao registrar", description: "Tente novamente." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAttendance = (id: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, "attendance", id));
    toast({ title: "Registro Removido" });
  };

  // Logic for counting absences
  const reportData = useMemo(() => {
    if (!students || !monthAttendance) return [];

    const start = startOfMonth(new Date(Number(reportYear), Number(reportMonth) - 1));
    const end = endOfMonth(new Date(Number(reportYear), Number(reportMonth) - 1));
    const weeksInMonth = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).length;

    const data = students.map(student => {
      const attendances = monthAttendance.filter(a => a.studentId === student.id);
      const count = attendances.length;
      
      // Determine dominant type based on presence or default to Weekly
      const hasSaturday = attendances.some(a => a.type === "Sábado");
      const target = hasSaturday ? weeksInMonth : (weeksInMonth * 2);
      
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

    if (searchQuery) {
      return data.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return data.sort((a, b) => a.name.localeCompare(b.name));
  }, [students, monthAttendance, reportMonth, reportYear, searchQuery]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CheckSquare className="h-6 w-6 text-primary" />
          Controle de Presença
        </h1>
      </div>

      <Tabs defaultValue="diario" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="diario">Registro Diário</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório de Faltas</TabsTrigger>
        </TabsList>

        <TabsContent value="diario" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Marcar Presença</CardTitle>
              <CardDescription>Registre a presença dos alunos nas aulas de hoje.</CardDescription>
            </CardHeader>
            <CardContent>
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
                  <label className="text-sm font-medium">Hora</label>
                  <Input type="time" value={classTime} onChange={e => setClassTime(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleRecordAttendance} disabled={isSubmitting}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Registrar Presença
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Presenças de Hoje ({format(new Date(), "dd/MM/yyyy")})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Tipo</TableHead>
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
                        <TableCell>{a.type}</TableCell>
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
                        Nenhuma presença registrada para hoje ainda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorio" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Frequência Mensal</CardTitle>
                  <CardDescription>Resumo de aulas feitas e faltas por aluno.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={reportMonth} onValueChange={setReportMonth}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <SelectItem key={i} value={String(i + 1).padStart(2, "0")}>
                          {format(new Date(2024, i, 1), "MMMM", { locale: ptBR })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={reportYear} onValueChange={setReportYear}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["2024", "2025", "2026"].map(y => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar aluno no relatório..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Faixa</TableHead>
                      <TableHead className="text-center">Aulas Feitas</TableHead>
                      <TableHead className="text-center">Meta Mensal</TableHead>
                      <TableHead className="text-center">Faltas Est.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingReport || isLoadingStudents ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                      ))
                    ) : reportData.length > 0 ? (
                      reportData.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">{d.name}</TableCell>
                          <TableCell>{d.belt}</TableCell>
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
              </div>
              <p className="text-xs text-muted-foreground italic">
                * A meta mensal é baseada em 2 aulas/semana ou 1 aula/sábado (detectado automaticamente pelas presenças registradas).
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
