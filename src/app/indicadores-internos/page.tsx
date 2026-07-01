
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
  UserPlus,
  BarChart2
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
  Cell,
  Legend
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

const BELT_ORDER = ['Branca', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Marrom', 'Preta'];

const BELT_CHART_COLORS: Record<string, string> = {
  Branca:  '#cbd5e1',
  Amarela: '#eab308',
  Laranja: '#f97316',
  Verde:   '#10b981',
  Azul:    '#3b82f6',
  Marrom:  '#92400e',
  Preta:   '#334155',
};

export default function IndicadoresInternosPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  // ── Filtros do card de presença por graduação ────────────────────────────
  const [beltAvgWindow, setBeltAvgWindow] = useState<'mes' | 'trimestre'>('mes');
  const [beltAvgBelt, setBeltAvgBelt] = useState('Todas');
  const [beltAvgSchedule, setBeltAvgSchedule] = useState('Todos');

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

  // ── Presença Média por Graduação e Turma ────────────────────────────────
  const studentBeltMap = useMemo(() => {
    if (!students) return {} as Record<string, string>;
    return Object.fromEntries(students.map(s => [s.id!, s.belt ?? '']));
  }, [students]);

  const beltAvgBaseAttendance = useMemo(() => {
    return beltAvgWindow === 'mes' ? attendanceThisMonth : (allAttendance ?? []);
  }, [beltAvgWindow, attendanceThisMonth, allAttendance]);

  const beltAvgChartData = useMemo(() => {
    if (!beltAvgBaseAttendance.length || !students) return { rows: [] as Record<string, string | number>[], turmas: [] as string[], belts: [] as string[] };
    const turmaMap: Record<string, { dates: Set<string>; beltCounts: Record<string, number> }> = {};

    beltAvgBaseAttendance
      .filter(a => !a.category || a.category === 'Aluno')
      .forEach(a => {
        const belt = a.studentId ? (studentBeltMap[a.studentId] || '') : '';
        if (!belt || !a.time || !a.date) return;
        let dayLabel = '';
        try {
          const dow = getDay(parseISO(a.date));
          if (dow === 1 || dow === 3) dayLabel = 'Seg/Qua';
          else if (dow === 2 || dow === 4) dayLabel = 'Ter/Qui';
          else if (dow === 6) dayLabel = 'Sábado';
          else if (dow === 5) dayLabel = 'Sexta';
          else return;
        } catch { return; }
        const turma = `${dayLabel} ${a.time}`;
        if (!turmaMap[turma]) turmaMap[turma] = { dates: new Set(), beltCounts: {} };
        turmaMap[turma].dates.add(a.date);
        turmaMap[turma].beltCounts[belt] = (turmaMap[turma].beltCounts[belt] || 0) + 1;
      });

    const beltSet = new Set<string>();
    const rows: Record<string, string | number>[] = Object.entries(turmaMap).map(([turma, data]) => {
      const sessions = data.dates.size || 1;
      const row: Record<string, string | number> = { turma };
      Object.entries(data.beltCounts).forEach(([belt, count]) => {
        row[belt] = parseFloat((count / sessions).toFixed(1));
        beltSet.add(belt);
      });
      return row;
    }).sort((a, b) => String(a.turma).localeCompare(String(b.turma)));

    const belts = BELT_ORDER.filter(b => beltSet.has(b));
    const turmas = rows.map(r => String(r.turma));
    return { rows, turmas, belts };
  }, [beltAvgBaseAttendance, studentBeltMap, students]);

  const beltAvgFilteredRows = useMemo(() => {
    return beltAvgSchedule !== 'Todos'
      ? beltAvgChartData.rows.filter(r => r.turma === beltAvgSchedule)
      : beltAvgChartData.rows;
  }, [beltAvgChartData.rows, beltAvgSchedule]);

  const beltAvgVisibleBelts = useMemo(() => {
    return beltAvgBelt === 'Todas'
      ? beltAvgChartData.belts
      : beltAvgChartData.belts.filter(b => b === beltAvgBelt);
  }, [beltAvgChartData.belts, beltAvgBelt]);

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

      {/* ── Presença Média por Graduação e Turma ──────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                Presença Média por Graduação e Turma
              </CardTitle>
              <CardDescription className="mt-1">
                Média de alunos por faixa em cada aula (presença total ÷ nº de sessões no período).
              </CardDescription>
            </div>
            {/* Filtros */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <Select value={beltAvgWindow} onValueChange={v => setBeltAvgWindow(v as 'mes' | 'trimestre')}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes">Mês selecionado</SelectItem>
                  <SelectItem value="trimestre">Últimos 3 meses</SelectItem>
                </SelectContent>
              </Select>
              <Select value={beltAvgBelt} onValueChange={setBeltAvgBelt}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas as faixas</SelectItem>
                  {BELT_ORDER.map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={beltAvgSchedule} onValueChange={setBeltAvgSchedule}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os horários</SelectItem>
                  {beltAvgChartData.turmas.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : beltAvgFilteredRows.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Sem dados para os filtros selecionados.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <div style={{ minWidth: beltAvgFilteredRows.length === 1 ? 320 : Math.max(400, beltAvgFilteredRows.length * (beltAvgVisibleBelts.length * 28 + 40)) }}>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={beltAvgFilteredRows}
                    margin={{ top: 10, right: 16, left: -10, bottom: 40 }}
                    barCategoryGap="25%"
                    barGap={2}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="turma"
                      tick={{ fontSize: 11 }}
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={v => String(v)}
                      label={{ value: 'Média / sessão', angle: -90, position: 'insideLeft', offset: 14, style: { fontSize: 10, fill: '#94a3b8' } }}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                      formatter={(val: number, name: string) => [`${val} aluno(s)/aula`, name]}
                    />
                    {beltAvgVisibleBelts.length > 1 && (
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    )}
                    {beltAvgVisibleBelts.map(belt => (
                      <Bar
                        key={belt}
                        dataKey={belt}
                        name={belt}
                        fill={BELT_CHART_COLORS[belt] ?? '#94a3b8'}
                        radius={[3, 3, 0, 0]}
                        maxBarSize={40}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {!isLoading && beltAvgFilteredRows.length > 0 && (
            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Apenas registros de categoria &quot;Aluno&quot;. Sábado conta como uma sessão separada.
            </p>
          )}
        </CardContent>
      </Card>

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
