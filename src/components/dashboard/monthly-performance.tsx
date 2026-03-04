
"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, where, doc } from "firebase/firestore";
import { useFirestore, useMemoFirebase, setDocumentNonBlocking, useDoc, useCollection } from "@/firebase";
import { MonthlyIndicator, Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Save, Loader2, ChevronLeft, ChevronRight, Users, TrendingUp, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const indicatorLabels: Record<keyof Omit<MonthlyIndicator, 'id' | 'year' | 'month' | 'previousMonthTotal' | 'totalStudents' | 'evolution' | 'conversionRate' | 'womensMonth'>, string> = {
  visits: "Visitas",
  trialClasses: "Aulas Exp.",
  newEnrollments: "Matrículas",
  reenrollments: "Rematrículas",
  exits: "Saídas",
};

type EditableIndicator = keyof typeof indicatorLabels;

export function MonthlyPerformance() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [indicator, setIndicator] = useState<Partial<MonthlyIndicator>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  const selectedYear = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth() + 1;
  const documentId = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  
  const indicatorRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'indicators', documentId);
  }, [firestore, documentId]);

  const { data: liveIndicator, isLoading: isLoadingIndicator } = useDoc<MonthlyIndicator>(indicatorRef);

  const studentsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'students');
  }, [firestore]);

  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsCollection);

  const activeStudentsCount = useMemo(() => {
    if (!students) return 0;
    return students.filter(s => s.status === 'Ativo').length;
  }, [students]);

  useEffect(() => {
    if (liveIndicator) {
        setIndicator(liveIndicator);
    } else {
        setIndicator({
            year: selectedYear,
            month: selectedMonth,
            visits: 0,
            trialClasses: 0,
            newEnrollments: 0,
            reenrollments: 0,
            exits: 0,
        });
    }
  }, [liveIndicator, selectedYear, selectedMonth]);
  

  const calculatedData = useMemo(() => {
    const data = { ...indicator };
    const enrollments = data.newEnrollments || 0;
    const reenrollments = data.reenrollments || 0;
    const exits = data.exits || 0;
    
    data.evolution = enrollments + reenrollments - exits;

    const conversionDivisor = (data.trialClasses || 0) + (data.visits || 0);
    data.conversionRate = conversionDivisor > 0 ? (enrollments / conversionDivisor) * 100 : 0;
    return data;
  }, [indicator]);

  const handleInputChange = (field: EditableIndicator, value: string) => {
    const numValue = value === '' ? 0 : Number(value);
    if (numValue !== undefined && isNaN(numValue)) return;
    setIndicator(prev => ({ ...prev, [field]: numValue }));
  };

  const handleSave = async () => {
    if (!firestore || !indicatorRef) return;
    setIsSaving(true);
    try {
      const dataToSave: Partial<MonthlyIndicator> = { 
        ...indicator, 
        id: documentId,
        year: selectedYear,
        month: selectedMonth,
      };
      await setDocumentNonBlocking(indicatorRef, dataToSave, { merge: true });
      toast({
        title: "Indicadores Salvos",
        description: `Os dados de ${format(currentDate, 'MMMM/yyyy', { locale: ptBR })} foram salvos.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: "Não foi possível salvar os dados. Tente novamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    setIndicator({}); 
    setCurrentDate(current => direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1));
  };

  const isLoading = isLoadingIndicator || isLoadingStudents;

  return (
    <Card className="shadow-sm border-muted-foreground/10">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Desempenho Mensal</CardTitle>
            <CardDescription>
              Acompanhamento de fluxo e retenção de alunos.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-bold text-center w-28 capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="ml-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
             {Object.keys(indicatorLabels).map(key => <Skeleton key={key} className="h-16 w-full" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-muted/10 p-4 rounded-xl border border-dashed">
            {Object.entries(indicatorLabels).map(([key, label]) => (
              <div key={key} className="space-y-1.5 text-center">
                <label className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">{label}</label>
                <Input
                  type="number"
                  placeholder="0"
                  className="h-9 text-center font-bold text-base focus-visible:ring-primary"
                  value={indicator[key as EditableIndicator] ?? ""}
                  onChange={(e) => handleInputChange(key as EditableIndicator, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-6">
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-blue-50 border border-blue-100 dark:bg-blue-950 dark:border-blue-900 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Alunos Ativos</span>
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-2xl font-black text-blue-900 dark:text-blue-100">
                        {isLoading ? <Skeleton className="h-8 w-12" /> : activeStudentsCount}
                    </span>
                </div>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-emerald-50 border border-emerald-100 dark:bg-emerald-950 dark:border-emerald-900 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Evolução Líquida</span>
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className={cn(
                        "text-2xl font-black",
                        (calculatedData.evolution ?? 0) > 0 ? "text-emerald-700" : (calculatedData.evolution ?? 0) < 0 ? "text-red-600" : "text-emerald-900"
                    )}>
                        {isLoading ? <Skeleton className="h-8 w-12" /> : `${(calculatedData.evolution ?? 0) > 0 ? '+' : ''}${calculatedData.evolution ?? 0}`}
                    </span>
                </div>
            </div>

             <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-amber-50 border border-amber-100 dark:bg-amber-950 dark:border-amber-900 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Taxa de Conversão</span>
                <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-amber-500" />
                    <span className="text-2xl font-black text-amber-900 dark:text-amber-100">
                        {isLoading ? <Skeleton className="h-8 w-16" /> : `${Math.round(calculatedData.conversionRate ?? 0)}%`}
                    </span>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
