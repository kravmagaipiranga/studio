
"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, where, doc, getDoc } from "firebase/firestore";
import { useFirestore, useMemoFirebase, setDocumentNonBlocking, useDoc, useCollection } from "@/firebase";
import { MonthlyIndicator, Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Save, Loader2, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const indicatorLabels: Record<keyof Omit<MonthlyIndicator, 'id' | 'year' | 'month' | 'previousMonthTotal' | 'totalStudents' | 'evolution' | 'conversionRate' | 'womensMonth'>, string> = {
  visits: "Visitas",
  trialClasses: "Aulas de Experiência",
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
        });
    }
  }, [liveIndicator, selectedYear, selectedMonth]);
  

  const calculatedData = useMemo(() => {
    const data = { ...indicator };
    const enrollments = data.newEnrollments || 0;
    const reenrollments = data.reenrollments || 0;
    const exits = data.exits || 0;
    
    // Evolução = Quem entrou (novos + rematrículas) - Quem saiu
    data.evolution = enrollments + reenrollments - exits;

    const conversionDivisor = (data.trialClasses || 0) + (data.visits || 0);
    data.conversionRate = conversionDivisor > 0 ? (enrollments / conversionDivisor) * 100 : 0;
    return data;
  }, [indicator]);

  const handleInputChange = (field: EditableIndicator, value: string) => {
    const numValue = value === '' ? undefined : Number(value);
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
    setIndicator({}); // Clear old data while new data loads
    setCurrentDate(current => direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1));
  };

  const isLoading = isLoadingIndicator || isLoadingStudents;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Desempenho Mensal</CardTitle>
            <CardDescription>
              Insira os dados do mês para acompanhar os resultados.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => changeMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-center w-32 capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <Button variant="outline" size="icon" onClick={() => changeMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
             {Object.keys(indicatorLabels).map(key => <Skeleton key={key} className="h-20 w-full" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(indicatorLabels).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{label}</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={indicator[key as EditableIndicator] ?? ""}
                  onChange={(e) => handleInputChange(key as EditableIndicator, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 border-t pt-4">
            <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm font-medium text-muted-foreground flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Total de Alunos Ativos
                </div>
                <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-1/2" /> : activeStudentsCount}</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm font-medium text-muted-foreground">Evolução no Mês</div>
                <div className={`text-2xl font-bold ${!isLoading && (calculatedData.evolution ?? 0) > 0 ? 'text-green-600' : (calculatedData.evolution ?? 0) < 0 ? 'text-red-600' : ''}`}>
                    {isLoading ? <Skeleton className="h-8 w-1/2" /> : `${(calculatedData.evolution ?? 0) > 0 ? '+' : ''}${calculatedData.evolution ?? 0}`}
                </div>
            </div>
             <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm font-medium text-muted-foreground">Taxa de Conversão</div>
                <div className="text-2xl font-bold">
                    {isLoading ? <Skeleton className="h-8 w-1/2" /> : `${Math.round(calculatedData.conversionRate ?? 0)}%`}
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
