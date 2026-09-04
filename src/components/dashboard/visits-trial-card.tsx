
"use client";

import { useState, useMemo, useEffect } from "react";
import { collection, query, where } from "firebase/firestore";
import { useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { Attendance, Student } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, FlaskConical, TrendingUp, UserRoundPlus } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function VisitsTrialCard() {
  const firestore = useFirestore();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const now = new Date();
    setSelectedMonth(format(now, "MM"));
    setSelectedYear(format(now, "yyyy"));
    setIsMounted(true);
  }, []);

  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore || !selectedMonth || !selectedYear) return null;
    const start = format(
      startOfMonth(new Date(Number(selectedYear), Number(selectedMonth) - 1)),
      "yyyy-MM-dd"
    );
    const end = format(
      endOfMonth(new Date(Number(selectedYear), Number(selectedMonth) - 1)),
      "yyyy-MM-dd"
    );
    return query(
      collection(firestore, "attendance"),
      where("date", ">=", start),
      where("date", "<=", end)
    );
  }, [firestore, selectedMonth, selectedYear]);

  const { data: attendance, isLoading } = useCollection<Attendance>(attendanceQuery);

  const studentsQuery = useMemoFirebase(() => {
    if (!firestore || !selectedMonth || !selectedYear) return null;
    return collection(firestore, "students");
  }, [firestore, selectedMonth, selectedYear]);

  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);

  const metrics = useMemo(() => {
    if (!attendance || !students) {
      return { visits: 0, experiences: 0, enrollments: 0, byDate: [] as { date: string; visits: number; experiences: number }[] };
    }

    let visits = 0;
    let experiences = 0;
    const byDateMap: Record<string, { visits: number; experiences: number }> = {};

    attendance.forEach(a => {
      if (a.category === "Visita") {
        visits++;
        byDateMap[a.date] = byDateMap[a.date] || { visits: 0, experiences: 0 };
        byDateMap[a.date].visits++;
      } else if (a.category === "Experiência") {
        experiences++;
        byDateMap[a.date] = byDateMap[a.date] || { visits: 0, experiences: 0 };
        byDateMap[a.date].experiences++;
      }
    });

    const byDate = Object.entries(byDateMap)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const period = `${selectedYear}-${selectedMonth}`;
    const enrollments = students.filter(student => student.activationDate?.slice(0, 7) === period).length;

    return { visits, experiences, enrollments, byDate };
  }, [attendance, students, selectedMonth, selectedYear]);

  const dataIsLoading = isLoading || isLoadingStudents;

  const months = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    return { value: m, label: capitalize(format(new Date(2024, i, 1), "MMMM", { locale: ptBR })) };
  });

  const conversionRate =
    metrics.experiences > 0 ? Math.round((metrics.visits / metrics.experiences) * 100) : null;

  if (!isMounted) return null;

  return (
    <Card className="shadow-sm border-muted-foreground/10">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Visitas e Aulas de Experiência</CardTitle>
            <CardDescription>
              Registros da chamada — sem preenchimento manual.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
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
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-orange-50 border border-orange-100 shadow-sm">
            <UserPlus className="h-5 w-5 text-orange-500 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 mb-1">Visitas</span>
            {dataIsLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <span className="text-3xl font-black text-orange-900">{metrics.visits}</span>
            )}
          </div>
          <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-blue-50 border border-blue-100 shadow-sm">
            <FlaskConical className="h-5 w-5 text-blue-500 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Aulas de Experiência</span>
            {dataIsLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <span className="text-3xl font-black text-blue-900">{metrics.experiences}</span>
            )}
          </div>
          <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-emerald-50 border border-emerald-100 shadow-sm">
            <TrendingUp className="h-5 w-5 text-emerald-500 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Visita → Experiência</span>
            {dataIsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <span className="text-3xl font-black text-emerald-900">
                {conversionRate !== null ? `${conversionRate}%` : "—"}
              </span>
            )}
          </div>
          <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-violet-50 border border-violet-100 shadow-sm">
            <UserRoundPlus className="h-5 w-5 text-violet-500 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600 mb-1">Matrículas</span>
            {dataIsLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <span className="text-3xl font-black text-violet-900">{metrics.enrollments}</span>
            )}
          </div>
        </div>

        {/* Daily breakdown */}
        {dataIsLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : metrics.byDate.length > 0 ? (
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Data</th>
                  <th className="text-center px-4 py-2 font-semibold text-orange-600 text-xs uppercase tracking-wide">Visitas</th>
                  <th className="text-center px-4 py-2 font-semibold text-blue-600 text-xs uppercase tracking-wide">Experiências</th>
                </tr>
              </thead>
              <tbody>
                {metrics.byDate.map((row, i) => {
                  const d = parseISO(row.date);
                  return (
                    <tr key={row.date} className={i % 2 === 0 ? "bg-white" : "bg-muted/10"}>
                      <td className="px-4 py-2 font-medium">
                        {capitalize(format(d, "dd 'de' MMMM", { locale: ptBR }))}
                      </td>
                      <td className="text-center px-4 py-2 font-bold text-orange-700">
                        {row.visits > 0 ? row.visits : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="text-center px-4 py-2 font-bold text-blue-700">
                        {row.experiences > 0 ? row.experiences : <span className="text-muted-foreground/40">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-20 text-muted-foreground text-sm rounded-xl border border-dashed">
            Nenhuma visita ou aula de experiência registrada neste mês.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
