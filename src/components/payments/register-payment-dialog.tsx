
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { addMonths, format } from 'date-fns';
import { useEffect, useState } from "react";
import { doc } from "firebase/firestore";

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
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

const formSchema = z.object({
  studentId: z.string({ required_error: "É necessário selecionar um aluno." }),
  planType: z.enum(["Mensal", "Trimestral", "Bolsa"]),
  planValue: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive("O valor deve ser positivo.")
  ),
  paymentDate: z.string().refine((val) => val, {
    message: "A data de pagamento é obrigatória.",
  }),
  paymentCredits: z.string().optional(),
})

interface RegisterPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  student?: Student;
  allStudents?: Student[];
}

export function RegisterPaymentDialog({
  isOpen,
  onOpenChange,
  student,
  allStudents = []
}: RegisterPaymentDialogProps) {
  const { toast } = useToast()
  const firestore = useFirestore();
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>(student);

  const studentOptions = allStudents.map(s => ({ value: s.id, label: s.name }));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    setSelectedStudent(student);
    form.reset({
      studentId: student?.id,
      planType: student?.planType || "Mensal",
      planValue: student?.planValue || 0,
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
      paymentCredits: student?.paymentCredits || "",
    })
  }, [student, isOpen, form]);

  useEffect(() => {
    if (!student && allStudents.length > 0) {
        const foundStudent = allStudents.find(s => s.id === form.getValues('studentId'));
        setSelectedStudent(foundStudent);
    }
  }, [form.watch('studentId'), allStudents, student]);


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

    const paymentDate = new Date(values.paymentDate + "T00:00:00");
    let expirationDate;
    if (values.planType === 'Mensal') {
        expirationDate = addMonths(paymentDate, 1);
    } else if (values.planType === 'Trimestral') {
        expirationDate = addMonths(paymentDate, 3);
    } else { // Bolsa
        expirationDate = addMonths(paymentDate, 1);
    }

    const updatedStudentData: Partial<Student> = {
        planType: values.planType,
        planValue: values.planValue,
        lastPaymentDate: paymentDate.toISOString().split('T')[0],
        planExpirationDate: expirationDate.toISOString().split('T')[0],
        paymentStatus: 'Pago',
        paymentCredits: values.paymentCredits,
    };

    const studentDocRef = doc(firestore, "students", targetStudent.id);
    
    // Non-blocking update
    setDocumentNonBlocking(studentDocRef, updatedStudentData, { merge: true });
    
    toast({
      title: "Pagamento Registrado!",
      description: `O pagamento para ${targetStudent.name} foi atualizado com sucesso.`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>
            {student ? `Para: ${student.name}` : "Selecione o aluno e preencha as informações."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            {!student && (
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
            )}
            <FormField
              control={form.control}
              name="planType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Plano</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o plano" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Mensal">Mensal</SelectItem>
                      <SelectItem value="Trimestral">Trimestral</SelectItem>
                      <SelectItem value="Bolsa">Bolsa</SelectItem>
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
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Data do Pagamento</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
              control={form.control}
              name="paymentCredits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Créditos / Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ex: R$ 50 de crédito ref. aula extra" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit">Salvar Pagamento</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
