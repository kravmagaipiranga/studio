
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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

const indicatorLabels: Record<keyof Omit<MonthlyIndicator, 'id' | 'year' | 'month' | 'totalStudents' | 'evolution' | 'conversionRate'>, string> = {
  previousMonthTotal: "Total mês anterior",
  visits: "Visitas",
  trialClasses: "Aulas Experimentais",
  newEnrollments: "Novas Matrículas",
  reenrollments: "Rematrículas",
  exits: "Saídas",
  womensMonth: "Mês das Mulheres",
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
    const numValue = value === '' ? null : Number(value);
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
            className="w-20 text-center"
            value={monthData[row as keyof MonthlyIndicator] as number ?? ''}
            onChange={(e) => handleInputChange(monthData.month!, row as EditableIndicator, e.target.value)}
            disabled={row === 'previousMonthTotal' && monthData.month !== 1}
        />
       );
    }
    
    if (isCalculated) {
        let value = monthData[row as keyof MonthlyIndicator] as number;
        let displayValue: string;
        let className = "font-semibold";

        if (row === 'conversionRate') {
            displayValue = `${Math.round(value || 0)}%`;
            if (value < 50) className += " text-red-600";
            else if (value < 100) className += " text-yellow-600";
            else className += " text-green-600";
        } else {
             displayValue = String(value || 0);
             if (row === 'evolution') {
                 if (value > 0) className += " text-green-600";
                 if (value < 0) className += " text-red-600";
             }
        }
        return <div className={className}>{displayValue}</div>;
    }

    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Indicadores Mensais</h1>
        <div className="flex items-center gap-2">
            <Select 
              value={String(selectedYear)}
              onValueChange={(value) => setSelectedYear(Number(value))}
            >
              <SelectTrigger className="w-32">
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
            <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relatório de Desempenho - {selectedYear}</CardTitle>
          <CardDescription>
            Preencha os dados de cada mês para acompanhar a evolução. Os campos calculados são atualizados automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px] sticky left-0 bg-card z-10">Indicador</TableHead>
                  {monthNames.map(name => <TableHead key={name} className="text-center">{name}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                    Object.keys(indicatorLabels).map(key => (
                         <TableRow key={key}>
                            <TableCell className="font-medium sticky left-0 bg-card z-10"><Skeleton className="h-6 w-3/4" /></TableCell>
                            {[...Array(12)].map((_, i) => <TableCell key={i}><Skeleton className="h-8 w-16 mx-auto" /></TableCell>)}
                        </TableRow>
                    ))
                )}
                {!isLoading && (
                    <>
                        {Object.entries(indicatorLabels).map(([key, label]) => (
                             <TableRow key={key}>
                                <TableCell className="font-medium sticky left-0 bg-card z-10">{label}</TableCell>
                                {calculatedData.map(monthData => (
                                    <TableCell key={monthData.month} className="text-center">
                                       {renderCell(key as keyof MonthlyIndicator, monthData)}
                                    </TableCell>
                                ))}
                             </TableRow>
                        ))}

                        <TableRow className="bg-muted font-bold">
                            <TableCell className="sticky left-0 bg-muted z-10">Total de Alunos</TableCell>
                            {calculatedData.map(monthData => (
                                <TableCell key={monthData.month} className="text-center">{monthData.totalStudents}</TableCell>
                            ))}
                        </TableRow>
                        <TableRow>
                            <TableCell className="sticky left-0 bg-card z-10">Evolução</TableCell>
                            {calculatedData.map(monthData => (
                                <TableCell key={monthData.month} className="text-center">
                                    {renderCell('evolution', monthData)}
                                </TableCell>
                            ))}
                        </TableRow>
                        <TableRow>
                            <TableCell className="sticky left-0 bg-card z-10">Taxa de Conversão</TableCell>
                            {calculatedData.map(monthData => (
                                <TableCell key={monthData.month} className="text-center">
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
      
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <TotalStudentsChart data={calculatedData} />
            <ConversionChart data={calculatedData} />
            <div className="lg:col-span-2">
                <MovementChart data={calculatedData} />
            </div>
        </div>
      )}
    </div>
  );
}
