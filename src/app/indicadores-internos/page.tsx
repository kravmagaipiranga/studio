
"use client";

import { useState, useMemo } from "react";
import { collection, query, where } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Student, Attendance } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  differenceInMonths 
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Users, 
  UserMinus, 
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

export default function IndicadoresInternosPage() {
  const firestore = useFirestore();
  const router = useRouter();
  
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "MM"));
  const [selectedYear, setSelectedYear] = useState(format(new Date(), "yyyy"));

  // Fetch data
  const studentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "students");
  }, [firestore]);

  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const start = format(startOfMonth(new Date(Number(selectedYear), Number(selectedMonth) - 1)), "yyyy-MM-dd");
    const end = format(endOfMonth(new Date(Number(selectedYear), Number(selectedMonth) - 1)), "yyyy-MM-dd");
    return query(
      collection(firestore, "attendance"),
      where("date", ">=", start),
      where("date", "<=", end)
    );
  }, [firestore, selectedMonth, selectedYear]);

  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);
  const { data: attendance, isLoading: isLoadingAttendance } = useCollection<Attendance>(attendanceQuery);

  const isLoading = isLoadingStudents || isLoadingAttendance;

  // 1. & 2. Turmas com mais/menos alunos
  const classRanking = useMemo(() => {
    if (!attendance) return [];
    const counts: Record<string, number> = {};
    attendance.forEach(a => {
      if (a.time) {
        counts[a.time] = (counts[a.time] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [attendance]);

  const mostPopularClass = classRanking[0] || null;
  const leastPopularClass = classRanking[classRanking.length - 1] || null;

  // 3. Alunos com mais faltas (Top 10)
  const absenceRanking = useMemo(() => {
    if (!students || !attendance) return [];
    
    const start = startOfMonth(new Date(Number(selectedYear), Number(selectedMonth) - 1));
    const end = endOfMonth(new Date(Number(selectedYear), Number(selectedMonth) - 1));
    const weeksInMonth = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).length;
    const expectedClasses = weeksInMonth * 2;

    return students
      .filter(s => s.status === 'Ativo')
      .map(s => {
        const studentAttendance = attendance.filter(a => a.studentId === s.id);
        const count = studentAttendance.reduce((acc, a) => acc + (a.type === "Sábado" ? 2 : 1), 0);
        const absences = Math.max(0, expectedClasses - count);
        return { name: s.name, absences, id: s.id };
      })
      .sort((a, b) => b.absences - a.absences)
      .slice(0, 10);
  }, [students, attendance, selectedMonth, selectedYear]);

  // 4. & 5. Visitas e Aulas de Experiência
  const trialMetrics = useMemo(() => {
    if (!attendance) return { visits: 0, experiences: 0 };
    return {
      visits: attendance.filter(a => a.category === 'Visita').length,
      experiences: attendance.filter(a => a.category === 'Experiência').length
    };
  }, [attendance]);

  // 6. Aniversariantes do mês
  const birthdaysCount = useMemo(() => {
    if (!students) return 0;
    return students.filter(s => {
      if (!s.dob) return false;
      const dobMonth = s.dob.split('-')[1];
      return dobMonth === selectedMonth;
    }).length;
  }, [students, selectedMonth]);

  // 7. Alunos Aptos a Revisão e Frequência
  const reviewMetrics = useMemo(() => {
    if (!students || !attendance) return [];
    const now = new Date();
    const weeksInMonth = eachWeekOfInterval({ 
        start: startOfMonth(new Date(Number(selectedYear), Number(selectedMonth) - 1)), 
        end: endOfMonth(new Date(Number(selectedYear), Number(selectedMonth) - 1)) 
    }, { weekStartsOn: 1 }).length;
    const meta = weeksInMonth * 2;

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

        const totalPresences = aptosInBelt.reduce((acc, s) => {
            const sAttendance = attendance.filter(a => a.studentId === s.id);
            return acc + sAttendance.reduce((sum, a) => sum + (a.type === 'Sábado' ? 2 : 1), 0);
        }, 0);

        const averagePresence = totalPresences / aptosInBelt.length;
        const performance = (averagePresence / meta) * 100;

        return {
            belt,
            count: aptosInBelt.length,
            performance: Math.round(performance)
        };
    }).filter(Boolean);
  }, [students, attendance, selectedMonth, selectedYear]);

  const formatMonth = (m: string) => {
    return format(new Date(2024, Number(m) - 1, 1), "MMMM", { locale: ptBR });
  };

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
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push('/alunos')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aniversariantes</CardTitle>
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
            <CardDescription>Presenças registradas em cada horário.</CardDescription>
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
                    <YAxis dataKey="name" type="category" width={100} />
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
                    <p className="text-muted-foreground font-medium">Turma mais cheia</p>
                    <p className="font-bold text-blue-900">{mostPopularClass.name}</p>
                  </div>
                </div>
              )}
              {leastPopularClass && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-50 border border-rose-100">
                  <TrendingDown className="h-4 w-4 text-rose-600" />
                  <div className="text-xs">
                    <p className="text-muted-foreground font-medium">Turma menos cheia</p>
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
            <CardDescription>Baseado na meta de 2 aulas por semana.</CardDescription>
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
                    onClick={() => router.push(`/chamada?tab=relatorio&search=${student.name}`)}
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
          <CardTitle>Aptos para Revisão - Frequência Média</CardTitle>
          <CardDescription>
            Relação entre alunos aptos por faixa e sua frequência média no mês (Meta: 2 aulas/semana).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
            ) : reviewMetrics.length > 0 ? (
              reviewMetrics.map((m: any) => (
                <div key={m.belt} className="p-4 rounded-xl border bg-card shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{m.belt}</span>
                    <span className="text-lg font-black text-primary">{m.count}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="uppercase text-muted-foreground">Engajamento</span>
                      <span className={cn(
                        m.performance >= 80 ? "text-emerald-600" : m.performance >= 50 ? "text-orange-600" : "text-red-600"
                      )}>{m.performance}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                            "h-full rounded-full transition-all duration-500",
                            m.performance >= 80 ? "bg-emerald-500" : m.performance >= 50 ? "bg-orange-500" : "bg-red-500"
                        )}
                        style={{ width: `${Math.min(100, m.performance)}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                    <Info className="h-3 w-3" /> Alunos cumprem tempo mínimo de faixa.
                  </p>
                </div>
              ))
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
