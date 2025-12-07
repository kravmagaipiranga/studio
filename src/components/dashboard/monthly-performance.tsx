
"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, where, doc, getDocs } from "firebase/firestore";
import { useFirestore, useMemoFirebase, setDocumentNonBlocking, useDoc } from "@/firebase";
import { MonthlyIndicator } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Save, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const indicatorLabels: Record<keyof Omit<MonthlyIndicator, 'id' | 'year' | 'month' | 'previousMonthTotal' | 'totalStudents' | 'evolution' | 'conversionRate' | 'reenrollments' | 'womensMonth'>, string> = {
  visits: "Visitas",
  trialClasses: "Aulas de Experiência",
  newEnrollments: "Matrículas",
  exits: "Saídas",
};

type EditableIndicator = keyof typeof indicatorLabels;

export function MonthlyPerformance() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [indicator, setIndicator] = useState<Partial<MonthlyIndicator>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [previousMonthTotal, setPreviousMonthTotal] = useState(0);

  const selectedYear = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth() + 1;
  const documentId = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  
  const indicatorRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'indicators', documentId);
  }, [firestore, documentId]);

  const { data: liveIndicator, isLoading } = useDoc<MonthlyIndicator>(indicatorRef);

  useEffect(() => {
    const fetchPreviousMonthTotal = async () => {
        if (!firestore) return;
        
        const prevMonthDate = subMonths(currentDate, 1);
        const prevMonthId = format(prevMonthDate, 'yyyy-MM');
        
        try {
            const prevMonthSnap = await getDocs(query(collection(firestore, 'indicators'), where('id', '==', prevMonthId)));
            if (!prevMonthSnap.empty) {
                const prevData = prevMonthSnap.docs[0].data() as MonthlyIndicator;
                setPreviousMonthTotal(prevData.totalStudents || 0);
            } else {
                setPreviousMonthTotal(0);
            }
        } catch (error) {
            console.error("Error fetching previous month's total:", error);
            setPreviousMonthTotal(0);
        }
    };

    fetchPreviousMonthTotal();
  }, [currentDate, firestore]);
  
  useEffect(() => {
    if (liveIndicator) {
      setIndicator(liveIndicator);
    } else {
      // If no data exists for the month, initialize with previous month's total
      setIndicator({ 
          year: selectedYear, 
          month: selectedMonth, 
          previousMonthTotal: previousMonthTotal 
      });
    }
  }, [liveIndicator, selectedYear, selectedMonth, previousMonthTotal]);


  const calculatedData = useMemo(() => {
    const data = { ...indicator };
    const prevTotal = data.previousMonthTotal || 0;
    const enrollments = data.newEnrollments || 0;
    const reenrollments = data.reenrollments || 0;
    const exits = data.exits || 0;
    
    data.totalStudents = prevTotal + enrollments + reenrollments - exits;
    data.evolution = data.totalStudents - prevTotal;

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
      const dataToSave = { ...calculatedData, id: documentId };
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
    setCurrentDate(current => direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1));
  };

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
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {Object.keys(indicatorLabels).map(key => <Skeleton key={key} className="h-20 w-full" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4">
            <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm font-medium text-muted-foreground">Total Alunos (Fim do Mês)</div>
                <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-1/2" /> : calculatedData.totalStudents ?? 0}</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm font-medium text-muted-foreground">Evolução</div>
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
             <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm font-medium text-muted-foreground">Total Alunos (Início)</div>
                <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-1/2" /> : indicator.previousMonthTotal ?? 0}</div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
