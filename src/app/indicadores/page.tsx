
"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, where, doc } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { type MonthlyIndicator } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { TotalStudentsChart } from "@/components/indicators/total-students-chart";
import { MovementChart } from "@/components/indicators/movement-chart";
import { ConversionChart } from "@/components/indicators/conversion-chart";

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const indicatorLabels: Record<keyof Omit<MonthlyIndicator, 'id' | 'year' | 'month' | 'totalStudents' | 'evolution' | 'conversionRate' | 'womensMonth'>, string> = {
  previousMonthTotal: "Total Ant.",
  visits: "Visitas",
  trialClasses: "Aulas Exp.",
  newEnrollments: "Matrículas",
  reenrollments: "Rematr.",
  exits: "Saídas",
};

type EditableIndicator = keyof typeof indicatorLabels;

export default function IndicadoresPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [indicators, setIndicators] = useState<Record<string, Partial<MonthlyIndicator>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const indicatorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'indicators'), where('year', '==', selectedYear));
  }, [firestore, selectedYear]);

  const { data: initialData, isLoading } = useCollection<MonthlyIndicator>(indicatorsQuery);

  useEffect(() => {
    if (initialData) {
      const dataByMonth: Record<string, Partial<MonthlyIndicator>> = {};
      initialData.forEach(item => {
        dataByMonth[item.month] = item;
      });
      setIndicators(dataByMonth);
    } else {
      setIndicators({});
    }
  }, [initialData]);

  const tableData = useMemo(() => {
    const data: (Partial<MonthlyIndicator> & { month: number })[] = [];
    for (let i = 1; i <= 12; i++) {
      data.push({
        month: i,
        ...indicators[i],
      });
    }
    return data;
  }, [indicators]);

  const calculatedData = useMemo(() => {
    const newTableData = [...tableData];
    for (let i = 0; i < newTableData.length; i++) {
        const currentMonth = newTableData[i];
        const previousMonthTotalStudents = i === 0 
            ? (currentMonth.previousMonthTotal || 0) 
            : (newTableData[i - 1].totalStudents || 0);
        
        if (i > 0) {
            currentMonth.previousMonthTotal = previousMonthTotalStudents;
        }

        const totalStudents = previousMonthTotalStudents + (currentMonth.newEnrollments || 0) + (currentMonth.reenrollments || 0) - (currentMonth.exits || 0);
        currentMonth.totalStudents = totalStudents;
        currentMonth.evolution = totalStudents - previousMonthTotalStudents;
        
        const conversionDivisor = (currentMonth.trialClasses || 0) + (currentMonth.visits || 0);
        currentMonth.conversionRate = conversionDivisor > 0 ? ((currentMonth.newEnrollments || 0) / conversionDivisor) * 100 : 0;
    }
    return newTableData;
  }, [tableData]);


  const handleInputChange = (month: number, field: EditableIndicator, value: string) => {
    const numValue = value === '' ? 0 : Number(value);
    if (numValue !== null && isNaN(numValue)) return;

    setIndicators(prev => ({
      ...prev,
      [month]: {
        ...prev[month],
        month,
        [field]: numValue,
      },
    }));
  };

  const handleSave = () => {
    if (!firestore) return;
    setIsSaving(true);
    const promises: Promise<void>[] = [];

    Object.values(indicators).forEach(indicator => {
      if (indicator.month) {
        const id = `${selectedYear}-${String(indicator.month).padStart(2, '0')}`;
        const docRef = doc(firestore, 'indicators', id);
        const dataToSave = {
          ...indicator,
          id,
          year: selectedYear,
        };
        promises.push(setDocumentNonBlocking(docRef, dataToSave, { merge: true }));
      }
    });

    Promise.all(promises)
      .then(() => {
        toast({
          title: "Indicadores Salvos",
          description: `Os dados de ${selectedYear} foram salvos com sucesso.`,
        });
      })
      .catch(() => {
        toast({
          variant: "destructive",
          title: "Erro ao Salvar",
          description: "Não foi possível salvar os dados. Tente novamente.",
        });
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const renderCell = (row: keyof MonthlyIndicator, monthData: Partial<MonthlyIndicator>) => {
    const isCalculated = ['totalStudents', 'evolution', 'conversionRate'].includes(row);
    const isEditable = Object.keys(indicatorLabels).includes(row);
    
    if (isEditable) {
       return (
         <Input
            type="number"
            className="w-14 text-center h-7 px-1 text-[11px] font-bold border-muted-foreground/20"
            value={monthData[row as keyof MonthlyIndicator] as number ?? ''}
            onChange={(e) => handleInputChange(monthData.month!, row as EditableIndicator, e.target.value)}
            disabled={row === 'previousMonthTotal' && monthData.month !== 1}
        />
       );
    }
    
    if (isCalculated) {
        let value = monthData[row as keyof MonthlyIndicator] as number;
        let displayValue: string;
        let className = "font-black text-[11px] tracking-tighter";

        if (row === 'conversionRate') {
            displayValue = `${Math.round(value || 0)}%`;
            if (value < 50) className += " text-red-600";
            else if (value < 100) className += " text-amber-600";
            else className += " text-emerald-600";
        } else {
             displayValue = String(value || 0);
             if (row === 'evolution') {
                 if (value > 0) className += " text-emerald-600";
                 if (value < 0) className += " text-red-600";
             }
        }
        return <div className={className}>{displayValue}</div>;
    }

    return null;
  }

  return (
    <div className="flex flex-col gap-4 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold md:text-2xl">Indicadores Anuais</h1>
        <div className="flex items-center gap-2">
            <Select 
              value={String(selectedYear)}
              onValueChange={(value) => setSelectedYear(Number(value))}
            >
              <SelectTrigger className="w-28 h-9">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(5)].map((_, i) => (
                  <SelectItem key={i} value={String(new Date().getFullYear() - i)}>
                    {new Date().getFullYear() - i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSave} disabled={isSaving} size="sm">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar
            </Button>
        </div>
      </div>
      
      <Card className="border-none shadow-sm bg-card rounded-xl overflow-hidden">
        <CardHeader className="px-6 py-4 border-b bg-muted/10">
          <CardTitle className="text-lg">Relatório de Desempenho - {selectedYear}</CardTitle>
          <CardDescription className="text-xs">
            Visão consolidada de Janeiro a Dezembro. Edite os valores diretamente na tabela.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/20">
                  <TableHead className="w-[110px] font-black text-[10px] uppercase sticky left-0 bg-white dark:bg-card border-r z-20">Indicador</TableHead>
                  {monthNames.map(name => <TableHead key={name} className="text-center text-[10px] p-1 font-black uppercase">{name.substring(0,3)}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                    Object.keys(indicatorLabels).map(key => (
                        <TableRow key={key}>
                            <TableCell className="font-medium sticky left-0 bg-white dark:bg-card border-r text-[11px] py-2 z-10"><Skeleton className="h-4 w-full" /></TableCell>
                            {[...Array(12)].map((_, i) => <TableCell key={i} className="p-1"><Skeleton className="h-7 w-10 mx-auto" /></TableCell>)}
                        </TableRow>
                    ))
                )}
                {!isLoading && (
                    <>
                        {Object.entries(indicatorLabels).map(([key, label]) => (
                            <TableRow key={key} className="hover:bg-muted/5">
                                <TableCell className="font-bold sticky left-0 bg-white dark:bg-card border-r text-[10px] uppercase text-muted-foreground py-2 z-10">{label}</TableCell>
                                {calculatedData.map(monthData => (
                                    <TableCell key={monthData.month} className="text-center p-1">
                                      {renderCell(key as keyof MonthlyIndicator, monthData)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}

                        <TableRow className="bg-primary/5 font-black">
                            <TableCell className="sticky left-0 bg-primary/10 z-10 text-[10px] uppercase py-2 border-r">Total Alunos</TableCell>
                            {calculatedData.map(monthData => (
                                <TableCell key={monthData.month} className="text-center p-1 py-2 text-[11px] font-black">{monthData.totalStudents}</TableCell>
                            ))}
                        </TableRow>
                        <TableRow className="hover:bg-muted/5">
                            <TableCell className="sticky left-0 bg-white dark:bg-card border-r text-[10px] uppercase py-2 font-bold z-10">Evolução</TableCell>
                            {calculatedData.map(monthData => (
                                <TableCell key={monthData.month} className="text-center p-1 py-2">
                                    {renderCell('evolution', monthData)}
                                </TableCell>
                            ))}
                        </TableRow>
                        <TableRow className="hover:bg-muted/5">
                            <TableCell className="sticky left-0 bg-white dark:bg-card border-r text-[10px] uppercase py-2 font-bold z-10">Conversão</TableCell>
                            {calculatedData.map(monthData => (
                                <TableCell key={monthData.month} className="text-center p-1 py-2">
                                    {renderCell('conversionRate', monthData)}
                                </TableCell>
                            ))}
                        </TableRow>
                    </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
           {isLoading ? (
              <>
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-64 w-full" />
              </>
           ) : (
              <>
                  <TotalStudentsChart data={calculatedData} />
                  <ConversionChart data={calculatedData} />
                  <MovementChart data={calculatedData} />
              </>
           )}
      </div>
    </div>
  );
}
