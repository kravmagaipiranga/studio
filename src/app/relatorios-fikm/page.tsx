
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addYears, format, getMonth, getYear, setMonth, setYear, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { FikmReport } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  enrollments: z.coerce.number().min(0, 'O valor não pode ser negativo.'),
  visits: z.coerce.number().min(0, 'O valor não pode ser negativo.'),
  trials: z.coerce.number().min(0, 'O valor não pode ser negativo.'),
  churns: z.coerce.number().min(0, 'O valor não pode ser negativo.'),
});

const years = Array.from({ length: 5 }, (_, i) => getYear(new Date()) - i);
const months = Array.from({ length: 12 }, (_, i) => ({
  value: i.toString(),
  label: ptBR.localize?.month(i, { width: 'wide' }),
}));

export default function FikmReportsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const [selectedDate, setSelectedDate] = useState(startOfMonth(new Date()));
  const reportId = format(selectedDate, 'yyyy-MM');

  const reportRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'fikm-reports', reportId);
  }, [firestore, reportId]);

  const { data: reportData, isLoading } = useDoc<FikmReport>(reportRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      enrollments: 0,
      visits: 0,
      trials: 0,
      churns: 0,
    },
  });

  useEffect(() => {
    if (reportData) {
      form.reset(reportData);
    } else {
      form.reset({
        enrollments: 0,
        visits: 0,
        trials: 0,
        churns: 0,
      });
    }
  }, [reportData, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Erro de conexão.' });
      return;
    }

    setDocumentNonBlocking(reportRef!, { id: reportId, ...values }, { merge: true });

    toast({
      title: 'Relatório Salvo!',
      description: `Os dados de ${format(selectedDate, 'MMMM/yyyy', { locale: ptBR })} foram salvos.`,
    });
  };

  const handleDateChange = (type: 'month' | 'year', value: string) => {
    const newDate = new Date(selectedDate);
    if (type === 'month') {
      setMonth(newDate, parseInt(value, 10));
    } else {
      setYear(newDate, parseInt(value, 10));
    }
    setSelectedDate(newDate);
  };
  
  const FormSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
    </div>
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Relatório Mensal FIKM</CardTitle>
            <CardDescription>
              Preencha os dados do mês para gerar o relatório da Federação. Selecione o mês e o ano para editar ou
              adicionar um novo relatório.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Select
                value={getMonth(selectedDate).toString()}
                onValueChange={(value) => handleDateChange('month', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={getYear(selectedDate).toString()}
                onValueChange={(value) => handleDateChange('year', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {isLoading ? <FormSkeleton /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="enrollments"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nº de Matrículas no Mês</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="visits"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nº de Visitas</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="trials"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nº de Aulas Experimentais</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="churns"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nº de Saídas de Alunos</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Carregando...' : 'Salvar Relatório'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
