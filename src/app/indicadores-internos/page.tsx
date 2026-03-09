
"use client";

import { useState, useMemo, useEffect } from "react";
import { collection, query, where } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Student, Attendance } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  format, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  eachWeekOfInterval, 
  differenceInMonths,
  getDay,
  subMonths
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Users, 
  Cake, 
  GraduationCap, 
  TrendingUp, 
  TrendingDown,
  Info,
  ChevronRight,
  UserPlus
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const beltColors: Record<string, { border: string; bg: string; text: string }> = {
  'Branca': { border: 'border-slate-200', bg: 'bg-white', text: 'text-slate-900' },
  'Amarela': { border: 'border-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-900' },
  'Laranja': { border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-900' },
  'Verde': { border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-900' },
  'Azul': { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-900' },
  'Marrom': { border: 'border-amber-800', bg: 'bg-amber-50', text: 'text-amber-900' },
  'Preta': { border: 'border-slate-900', bg: 'bg-slate-100', text: 'text-slate-900' },
};

export default function IndicadoresInternosPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  useEffect(() => {
    const now = new Date();
    setSelectedMonth(format(now, "MM"));
    setSelectedYear(format(now, "yyyy"));
    setIsMounted(true);
  }, []);

  // Fetch data - Busca 3 meses para cálculo de frequência acumulada
  const studentsQuery = useMemoFirebase(() => {
    if (!firestore || !isMounted) return null;
    return collection(firestore, "students");
  }, [firestore, isMounted]);

  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore || !selectedMonth || !selectedYear) return null;
    const currentEnd = endOfMonth(new Date(Number(selectedYear), Number(selectedMonth) - 1));
    const threeMonthsAgoStart = startOfMonth(subMonths(currentEnd, 2));
    
    return query(
      collection(firestore, "attendance"),
      where("date", ">=", format(threeMonthsAgoStart, "yyyy-MM-dd")),
      where("date", "<=", format(currentEnd, "yyyy-MM-dd"))
    );
  }, [firestore, selectedMonth, selectedYear]);

  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);
  const { data: allAttendance, isLoading: isLoadingAttendance } = useCollection<Attendance>(attendanceQuery);

  const isLoading = isLoadingStudents || isLoadingAttendance || !isMounted;

  // Filtra presenças apenas do mês selecionado para os gráficos mensais
  const attendanceThisMonth = useMemo(() => {
    if (!allAttendance || !selectedMonth || !selectedYear) return [];
    const start = format(startOfMonth(new Date(Number(selectedYear), Number(selectedMonth) - 1)), "yyyy-MM-dd");
    const end = format(endOfMonth(new Date(Number(selectedYear), Number(selectedMonth) - 1)), "yyyy-MM-dd");
    return allAttendance.filter(a => a.date >= start && a.date <= end);
  }, [allAttendance, selectedMonth, selectedYear]);

  // 1. & 2. Turmas com mais/menos alunos (Baseado no mês atual)
  const classRanking = useMemo(() => {
    if (!attendanceThisMonth || !isMounted) return [];
    const counts: Record<string, number> = {};
    
    attendanceThisMonth.forEach(a => {
      if (a.time && a.date) {
        try {
            const date = parseISO(a.date);
            const dayOfWeek = getDay(date);
            let dayLabel = "";

            if (dayOfWeek === 1 || dayOfWeek === 3) {
                dayLabel = "Seg/Qua";
            } else if (dayOfWeek === 2 || dayOfWeek === 4) {
                dayLabel = "Ter/Qui";
            } else if (dayOfWeek === 6) {
                dayLabel = "Sábado";
            } else if (dayOfWeek === 5) {
                dayLabel = "Sexta";
            } else {
                dayLabel = "Domingo";
            }

            const fullLabel = `${dayLabel} ${a.time}`;
            counts[fullLabel] = (counts[fullLabel] || 0) + 1;
        } catch (e) {
            counts[a.time] = (counts[a.time] || 0) + 1;
        }
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [attendanceThisMonth, isMounted]);

  const mostPopularClass = classRanking[0] || null;
  const leastPopularClass = classRanking[classRanking.length - 1] || null;

  // 3. Alunos com mais faltas (Baseado no mês atual)
  const absenceRanking = useMemo(() => {
    if (!students || !attendanceThisMonth || !selectedMonth || !selectedYear) return [];
    
    const start = startOfMonth(new Date(Number(selectedYear), Number(selectedMonth) - 1));
    const end = endOfMonth(new Date(Number(selectedYear), Number(selectedMonth) - 1));
    const weeksInMonth = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).length;
    const expectedClasses = weeksInMonth * 2;

    return students
      .filter(s => s.status === 'Ativo')
      .map(s => {
        const studentAttendance = attendanceThisMonth.filter(a => a.studentId === s.id);
        const count = studentAttendance.reduce((acc, a) => acc + (a.type === "Sábado" ? 2 : 1), 0);
        const absences = Math.max(0, expectedClasses - count);
        return { name: s.name, absences, id: s.id };
      })
      .sort((a, b) => b.absences - a.absences)
      .slice(0, 10);
  }, [students, attendanceThisMonth, selectedMonth, selectedYear]);

  // 4. & 5. Visitas e Aulas de Experiência (Mês atual)
  const trialMetrics = useMemo(() => {
    if (!attendanceThisMonth) return { visits: 0, experiences: 0 };
    return {
      visits: attendanceThisMonth.filter(a => a.category === 'Visita').length,
      experiences: attendanceThisMonth.filter(a => a.category === 'Experiência').length
    };
  }, [attendanceThisMonth]);

  // 6. Aniversariantes do mês count (Apenas Ativos)
  const birthdaysCount = useMemo(() => {
    if (!students || !selectedMonth) return 0;
    return students.filter(s => s.status === 'Ativo' && s.dob && s.dob.split('-')[1] === selectedMonth).length;
  }, [students, selectedMonth]);

  // 7. Alunos Aptos a Revision e Frequência (BASEADO NOS ÚLTIMOS 3 MESES)
  const reviewMetrics = useMemo(() => {
    if (!students || !allAttendance || !selectedMonth || !selectedYear) return [];
    const now = new Date();
    
    // Cálculo da meta acumulada de 3 meses
    const currentEnd = endOfMonth(new Date(Number(selectedYear), Number(selectedMonth) - 1));
    let totalMeta = 0;
    for (let i = 0; i < 3; i++) {
        const targetDate = subMonths(currentEnd, i);
        const mStart = startOfMonth(targetDate);
        const mEnd = endOfMonth(targetDate);
        const weeks = eachWeekOfInterval({ start: mStart, end: mEnd }, { weekStartsOn: 1 }).length;
        totalMeta += (weeks * 2);
    }

    const aptos = students.filter(s => {
        if (s.status !== 'Ativo' || !s.belt) return false;
        const belt = s.belt.toLowerCase();
        try {
            const dateToCalc = s.lastExamDate || s.startDate || s.registrationDate;
            if (!dateToCalc) return false;
            const monthsInBelt = differenceInMonths(now, parseISO(dateToCalc));
            
            if (belt === 'branca') return monthsInBelt >= 4;
            if (belt === 'amarela') return monthsInBelt >= 12;
            if (belt === 'laranja') return monthsInBelt >= 18;
            if (belt === 'verde' || belt === 'azul') return monthsInBelt >= 24;
            if (belt === 'marrom') return monthsInBelt >= 36;
        } catch { return false; }
        return false;
    });

    const belts = ['Branca', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Marrom', 'Preta'];
    return belts.map(belt => {
        const aptosInBelt = aptos.filter(s => s.belt === belt);
        if (aptosInBelt.length === 0) return null;

        const studentsDetails = aptosInBelt.map(s => {
            const sAttendance = allAttendance.filter(a => a.studentId === s.id);
            const count = sAttendance.reduce((sum, a) => sum + (a.type === 'Sábado' ? 2 : 1), 0);
            const perf = Math.round((count / totalMeta) * 100);
            return { name: s.name, performance: perf };
        }).sort((a, b) => b.performance - a.performance);

        const totalPresences = aptosInBelt.reduce((acc, s) => {
            const sAttendance = allAttendance.filter(a => a.studentId === s.id);
            return acc + sAttendance.reduce((sum, a) => sum + (a.type === 'Sábado' ? 2 : 1), 0);
        }, 0);

        const averagePresence = totalPresences / aptosInBelt.length;
        const performance = (averagePresence / totalMeta) * 100;

        return {
            belt,
            count: aptosInBelt.length,
            performance: Math.round(performance),
            students: studentsDetails
        };
    }).filter(Boolean);
  }, [students, allAttendance, selectedMonth, selectedYear]);

  const formatMonth = (m: string) => {
    if (!m) return "";
    return format(new Date(2024, Number(m) - 1, 1), "MMMM", { locale: ptBR });
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Indicadores Internos</h1>
          <p className="text-muted-foreground">Monitoramento de desempenho e engajamento da escola.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }).map((_, i) => (
                <SelectItem key={i} value={String(i + 1).padStart(2, "0")}>
                  {formatMonth(String(i + 1).padStart(2, "0"))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
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

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push('/chamada')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas (Mês)</CardTitle>
            <UserPlus className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-12" /> : trialMetrics.visits}</div>
            <p className="text-xs text-muted-foreground">Interessados que visitaram o CT</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push('/chamada')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aulas de Experiência</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-12" /> : trialMetrics.experiences}</div>
            <p className="text-xs text-muted-foreground">Realizadas neste mês</p>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors" 
          onClick={() => router.push(`/indicadores-internos/aniversariantes?month=${selectedMonth}&year=${selectedYear}`)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aniversariantes (Ativos)</CardTitle>
            <Cake className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-12" /> : birthdaysCount}</div>
            <p className="text-xs text-muted-foreground">Em {formatMonth(selectedMonth)}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push('/alunos?filter=aptos')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aptos para Revisão</CardTitle>
            <GraduationCap className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-12" /> : reviewMetrics.reduce((acc, curr: any) => acc + curr.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Cumprem o tempo de faixa</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Turmas Ranking */}
        <Card>
          <CardHeader>
            <CardTitle>Engajamento por Turma</CardTitle>
            <CardDescription>Presenças registradas por ciclo de dia e horário no mês selecionado.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : classRanking.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classRanking} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={120} fontSize={10} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(val) => [val, "Presenças"]}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {classRanking.map((entry, index) => (
                        <Cell key={index} fill={index === 0 ? "#2563eb" : index === classRanking.length - 1 ? "#ef4444" : "#94a3b8"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">Sem dados para este período.</div>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {mostPopularClass && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-100">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <div className="text-xs">
                    <p className="text-muted-foreground font-medium">Mais cheia</p>
                    <p className="font-bold text-blue-900">{mostPopularClass.name}</p>
                  </div>
                </div>
              )}
              {leastPopularClass && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-50 border border-rose-100">
                  <TrendingDown className="h-4 w-4 text-rose-600" />
                  <div className="text-xs">
                    <p className="text-muted-foreground font-medium">Menos cheia</p>
                    <p className="font-bold text-rose-900">{leastPopularClass.name}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Faltas Ranking */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Top Alunos com Mais Faltas</CardTitle>
            <CardDescription>Baseado na meta de 2 aulas por semana no mês selecionado.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-auto">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : absenceRanking.length > 0 ? (
              <div className="divide-y">
                {absenceRanking.map((student, i) => (
                  <div 
                    key={student.id} 
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/chamada?tab=relatorio&search=${student.name}&month=${selectedMonth}&year=${selectedYear}`)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                      <p className="text-sm font-medium">{student.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded",
                        student.absences > 5 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                      )}>
                        {student.absences} faltas est.
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-muted-foreground">Nenhum registro encontrado.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revisão por Faixa e Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Aptos para Revisão - Frequência Trimestral Média</CardTitle>
          <CardDescription>
            Performance acumulada baseada nos últimos 3 meses (incluindo o selecionado).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
            ) : reviewMetrics.length > 0 ? (
              reviewMetrics.map((m: any) => {
                const styles = beltColors[m.belt] || beltColors['Branca'];
                return (
                  <div key={m.belt} className={cn(
                    "flex flex-col rounded-xl border shadow-sm overflow-hidden",
                    styles.border
                  )}>
                    {/* Header do Card */}
                    <div className={cn("p-4 border-b", styles.bg)}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn("text-xs font-black uppercase tracking-wider", styles.text)}>{m.belt}</span>
                        <div className="flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-full border shadow-sm">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-bold">{m.count}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase text-muted-foreground">
                          <span>Média Trimestral</span>
                          <span className={cn(
                            m.performance >= 80 ? "text-emerald-600" : m.performance >= 50 ? "text-orange-600" : "text-red-600"
                          )}>{m.performance}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                                "h-full rounded-full transition-all duration-500",
                                m.performance >= 80 ? "bg-emerald-500" : m.performance >= 50 ? "bg-orange-500" : "bg-red-500"
                            )}
                            style={{ width: `${Math.min(100, m.performance)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Lista de Alunos */}
                    <div className="flex-1 p-2 bg-card">
                      <div className="space-y-1">
                        {m.students.map((student: any, idx: number) => (
                          <div 
                            key={idx} 
                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors text-xs cursor-pointer"
                            onClick={() => router.push(`/chamada?tab=relatorio&search=${student.name}&month=${selectedMonth}&year=${selectedYear}`)}
                          >
                            <span className="font-medium truncate pr-2">{student.name}</span>
                            <span className={cn(
                              "font-bold tabular-nums shrink-0",
                              student.performance >= 80 ? "text-emerald-600" : student.performance >= 50 ? "text-orange-600" : "text-red-600"
                            )}>{student.performance}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-2 border-t bg-muted/30">
                       <p className="text-[9px] text-muted-foreground text-center italic flex items-center justify-center gap-1">
                        <Info className="h-2.5 w-2.5" /> Meta: 2 aulas/semana (Acumulado)
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-10 text-center text-muted-foreground">
                Nenhum aluno apto para revisão neste período.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
