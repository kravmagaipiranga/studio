

"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { addMonths, format, parseISO, setDate } from 'date-fns';
import { useEffect, useState } from "react";
import { collection, doc } from "firebase/firestore";
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
import { Student, Payment } from "@/lib/types"
import { Combobox } from "@/components/ui/combobox";
import { useFirestore, addDocumentNonBlocking } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

const formSchema = z.object({
  studentId: z.string({ required_error: "É necessário selecionar um aluno." }),
  planType: z.enum(["Matrícula", "Mensal", "Trimestral", "Bolsa 50%", "Bolsa 100%", "Outros"]),
  amount: z.preprocess(
    (a) => {
        if (typeof a === 'string') return parseFloat(a.replace(',', '.'));
        return a;
    },
    z.number().positive("O valor deve ser positivo.").or(z.literal(0))
  ),
  paymentDate: z.string().refine((val) => val, {
    message: "A data de pagamento é obrigatória.",
  }),
  paymentMethod: z.enum(["Pix", "Cartão", "Dinheiro", "Pendente"]),
  notes: z.string().optional(),
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
        amount: 315,
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: "Pix",
        notes: "",
    },
  });

  const paymentDateWatcher = form.watch('paymentDate');
  const planTypeWatcher = form.watch('planType');

  useEffect(() => {
    switch (planTypeWatcher) {
      case 'Matrícula':
        form.setValue('amount', 160);
        break;
      case 'Mensal':
        form.setValue('amount', 315);
        break;
      case 'Trimestral':
        form.setValue('amount', 898);
        break;
      case 'Bolsa 50%':
        form.setValue('amount', 160);
        break;
      case 'Bolsa 100%':
      case 'Outros':
        form.setValue('amount', 0);
        break;
    }
  }, [planTypeWatcher, form]);

  useEffect(() => {
    if (paymentDateWatcher && planTypeWatcher) {
        try {
            if (planTypeWatcher === 'Matrícula') {
                setCalculatedExpiryDate('Não se aplica');
                return;
            }

            const paymentDate = parseISO(paymentDateWatcher);
            let expiryDate: Date | null = null;
            
            if (planTypeWatcher === 'Bolsa 100%') {
                const currentYear = paymentDate.getFullYear();
                expiryDate = new Date(currentYear, 11, 31); // December 31st
            } else {
                let monthsToAdd = 1; // Default for Mensal, Outros, Bolsa 50%
                if (planTypeWatcher === 'Trimestral') monthsToAdd = 3;

                const futureMonth = addMonths(paymentDate, monthsToAdd);
                expiryDate = setDate(futureMonth, 5); // Set due date to the 5th
            }
            
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
          planType: studentPlanType as any,
          amount: studentToLoad.planValue ?? 315, // Fallback for existing data
          paymentDate: format(new Date(), 'yyyy-MM-dd'),
          paymentMethod: "Pix",
          notes: "",
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
                form.setValue('planType', studentPlanType as any);
                form.setValue('amount', foundStudent.planValue ?? 315);
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
    
    let expirationDateISO: string | undefined = undefined;

    if (values.planType !== 'Matrícula') {
        const paymentDate = parseISO(values.paymentDate);
        let expirationDate: Date | null = null;
        if (values.planType === 'Bolsa 100%') {
            expirationDate = new Date(paymentDate.getFullYear(), 11, 31);
        } else {
            const monthsToAdd = values.planType === 'Trimestral' ? 3 : 1;
            expirationDate = setDate(addMonths(paymentDate, monthsToAdd), 5);
        }
        expirationDateISO = expirationDate.toISOString().split('T')[0];
    }
    

    const paymentData: Omit<Payment, 'id'> = {
        studentId: values.studentId,
        studentName: targetStudent.name,
        paymentDate: values.paymentDate,
        planType: values.planType,
        amount: values.amount,
        expirationDate: expirationDateISO,
        paymentMethod: values.paymentMethod,
        notes: values.notes,
    };

    const paymentsCollectionRef = collection(firestore, "payments");
    addDocumentNonBlocking(paymentsCollectionRef, paymentData);
    
    toast({
      title: "Pagamento Registrado!",
      description: `O pagamento para ${targetStudent.name} foi adicionado com sucesso.`,
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
                        <FormLabel>Tipo de Pagamento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o plano" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="Matrícula">Matrícula</SelectItem>
                            <SelectItem value="Mensal">Mensal</SelectItem>
                            <SelectItem value="Trimestral">Trimestral</SelectItem>
                            <SelectItem value="Bolsa 50%">Bolsa 50%</SelectItem>
                            <SelectItem value="Bolsa 100%">Bolsa 100%</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="amount"
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
                                placeholder={planTypeWatcher === 'Matrícula' ? 'Não se aplica' : 'Calculada...'}
                                className="disabled:opacity-100 disabled:cursor-default"
                            />
                        </FormControl>
                    </FormItem>
                </div>
                 <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Forma de Pagamento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Pendente">Pendente</SelectItem>
                                <SelectItem value="Pix">Pix</SelectItem>
                                <SelectItem value="Cartão">Cartão</SelectItem>
                                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Ex: Pagamento referente à..." {...field} value={field.value ?? ''} />
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
