

"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { addMonths, format, parseISO, setDate } from 'date-fns';
import { useEffect, useState } from "react";
import { doc } from "firebase/firestore";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Student } from "@/lib/types"
import { Combobox } from "@/components/ui/combobox";
import { useFirestore, setDocumentNonBlocking } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

const formSchema = z.object({
  studentId: z.string({ required_error: "É necessário selecionar um aluno." }),
  planType: z.enum(["Mensal", "Trimestral", "Bolsa", "Outros"]),
  planValue: z.preprocess(
    (a) => {
        if (typeof a === 'string') return parseFloat(a.replace(',', '.'));
        return a;
    },
    z.number().positive("O valor deve ser positivo.")
  ),
  paymentDate: z.string().refine((val) => val, {
    message: "A data de pagamento é obrigatória.",
  }),
  paymentCredits: z.string().optional(),
})

interface RegisterPaymentFormProps {
  allStudents?: Student[];
  studentIdFromUrl?: string | null;
}

export function RegisterPaymentForm({
  allStudents = [],
  studentIdFromUrl
}: RegisterPaymentFormProps) {
  const { toast } = useToast()
  const firestore = useFirestore();
  const router = useRouter();
  
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>(undefined);
  const [calculatedExpiryDate, setCalculatedExpiryDate] = useState<string>('');
  
  const studentOptions = allStudents.slice().sort((a, b) => a.name.localeCompare(b.name)).map(s => ({ value: s.id, label: s.name }));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        studentId: '',
        planType: "Mensal",
        planValue: 315,
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        paymentCredits: "",
    },
  });

  const paymentDateWatcher = form.watch('paymentDate');
  const planTypeWatcher = form.watch('planType');

  useEffect(() => {
    switch (planTypeWatcher) {
      case 'Mensal':
        form.setValue('planValue', 315);
        break;
      case 'Trimestral':
        form.setValue('planValue', 898);
        break;
      case 'Bolsa':
      case 'Outros':
        form.setValue('planValue', 0);
        break;
    }
  }, [planTypeWatcher, form]);

  useEffect(() => {
    if (paymentDateWatcher && planTypeWatcher) {
        if (planTypeWatcher === 'Bolsa') {
            setCalculatedExpiryDate('Não se aplica');
            return;
        }

        try {
            const paymentDate = parseISO(paymentDateWatcher);
            let monthsToAdd = 1;
            if (planTypeWatcher === 'Trimestral') monthsToAdd = 3;
            if (planTypeWatcher === 'Outros') monthsToAdd = 1;


            const futureMonth = addMonths(paymentDate, monthsToAdd);
            const expiryDate = setDate(futureMonth, 5); // Set due date to the 5th
            setCalculatedExpiryDate(format(expiryDate, 'dd/MM/yyyy'));
        } catch (e) {
            setCalculatedExpiryDate('');
        }
    } else {
        setCalculatedExpiryDate('');
    }
  }, [paymentDateWatcher, planTypeWatcher]);


  useEffect(() => {
    const studentToLoad = studentIdFromUrl ? allStudents.find(s => s.id === studentIdFromUrl) : undefined;
    
    if (studentToLoad) {
      setSelectedStudent(studentToLoad);
      const studentPlanType = studentToLoad.planType || 'Mensal';
      form.reset({
          studentId: studentToLoad.id,
          planType: studentPlanType,
          planValue: studentToLoad.planValue || (studentPlanType === 'Mensal' ? 315 : (studentPlanType === 'Trimestral' ? 898 : 0)),
          paymentDate: format(new Date(), 'yyyy-MM-dd'),
          paymentCredits: studentToLoad.paymentCredits || "",
      });
    }
  }, [studentIdFromUrl, allStudents, form]);


  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
        if (name === 'studentId' && values.studentId) {
            const foundStudent = allStudents.find(s => s.id === values.studentId);
            if (foundStudent && foundStudent.id !== selectedStudent?.id) {
                setSelectedStudent(foundStudent);
                const studentPlanType = foundStudent.planType || 'Mensal';
                form.setValue('planType', studentPlanType);
                form.setValue('planValue', foundStudent.planValue || (studentPlanType === 'Mensal' ? 315 : (studentPlanType === 'Trimestral' ? 898 : 0)));
                form.setValue('paymentCredits', foundStudent.paymentCredits || '');
            }
        }
    });
    return () => subscription.unsubscribe();
  }, [form, allStudents, selectedStudent]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
        toast({ title: "Erro", description: "Banco de dados não disponível.", variant: "destructive" });
        return;
    }

    const targetStudent = allStudents.find(s => s.id === values.studentId);
    if (!targetStudent) {
        toast({ title: "Erro", description: "Aluno não encontrado.", variant: "destructive" });
        return;
    }
    
    const paymentDate = parseISO(values.paymentDate);
    let expirationDate: Date | null = null;
    
    if (values.planType === 'Mensal' || values.planType === 'Outros') {
        expirationDate = setDate(addMonths(paymentDate, 1), 5);
    } else if (values.planType === 'Trimestral') {
        expirationDate = setDate(addMonths(paymentDate, 3), 5);
    }

    const updatedStudentData: Partial<Student> = {
        planType: values.planType,
        planValue: values.planValue,
        lastPaymentDate: values.paymentDate,
        planExpirationDate: expirationDate ? expirationDate.toISOString().split('T')[0] : undefined,
        paymentStatus: 'Pago',
        paymentCredits: values.paymentCredits,
    };

    const studentDocRef = doc(firestore, "students", targetStudent.id);
    
    setDocumentNonBlocking(studentDocRef, updatedStudentData, { merge: true });
    
    toast({
      title: "Pagamento Registrado!",
      description: `O pagamento para ${targetStudent.name} foi atualizado com sucesso.`,
    })
    router.push('/pagamentos');
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Registrar Pagamento</CardTitle>
          <CardDescription>
            {selectedStudent ? `Para: ${selectedStudent.name}` : "Selecione o aluno e preencha as informações."}
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Aluno</FormLabel>
                        <Combobox
                            options={studentOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Selecione um aluno..."
                            searchPlaceholder="Buscar aluno..."
                            notFoundText="Nenhum aluno encontrado."
                        />
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="planType"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tipo de Plano</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o plano" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="Mensal">Mensal</SelectItem>
                            <SelectItem value="Trimestral">Trimestral</SelectItem>
                            <SelectItem value="Bolsa">Bolsa</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="planValue"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Valor (R$)</FormLabel>
                        <FormControl>
                            <Input 
                                type="number" 
                                step="0.01" 
                                {...field} 
                                disabled={planTypeWatcher !== 'Outros'}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="paymentDate"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Data do Pagamento</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormItem>
                        <FormLabel>Validade do Plano</FormLabel>
                        <FormControl>
                            <Input
                                type="text"
                                value={calculatedExpiryDate}
                                disabled
                                placeholder="Calculada automaticamente..."
                                className="disabled:opacity-100 disabled:cursor-default"
                            />
                        </FormControl>
                    </FormItem>
                </div>
                <FormField
                control={form.control}
                name="paymentCredits"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Créditos / Observações</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Ex: R$ 50 de crédito ref. aula extra" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <div className="flex justify-end gap-2 mt-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                    <Button type="submit">Salvar Pagamento</Button>
                </div>
            </form>
            </Form>
        </CardContent>
    </Card>
  )
}
