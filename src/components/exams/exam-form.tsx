
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useState } from "react";
import { collection, doc } from 'firebase/firestore'
import { useRouter } from "next/navigation"
import { format, differenceInYears } from "date-fns"

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
import { useToast } from "@/hooks/use-toast"
import { useFirestore, setDocumentNonBlocking } from "@/firebase"
import { Exam, Student } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Combobox } from "../ui/combobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const formSchema = z.object({
  studentId: z.string({ required_error: "É necessário selecionar um aluno." }),
  examDate: z.string().refine((val) => val, { message: "A data do exame é obrigatória." }),
  targetBelt: z.string().min(1, "A faixa pretendida é obrigatória."),
  paymentAmount: z.preprocess(
    (a) => {
        if (typeof a === 'string') return parseFloat(a.replace(',', '.'));
        return a;
    },
    z.number().positive("O valor deve ser positivo.")
  ),
  paymentStatus: z.enum(["Pago", "Pendente"]),
  paymentMethod: z.enum(["Pix", "Cartão", "Dinheiro", "Pendente"]),
});

interface ExamFormProps {
  exam?: Exam | null;
  allStudents: Student[];
  isEditing: boolean;
}

export function ExamForm({ exam, allStudents, isEditing }: ExamFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const firestore = useFirestore();
  
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>(undefined);
  const studentOptions = allStudents.map(s => ({ value: s.id, label: s.name }));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: "",
      examDate: "",
      targetBelt: "",
      paymentAmount: 200,
      paymentStatus: 'Pendente',
      paymentMethod: 'Pendente',
    },
  });

  useEffect(() => {
    if (isEditing && exam) {
        const student = allStudents.find(s => s.id === exam.studentId);
        setSelectedStudent(student);
        form.reset({
          ...exam,
          examDate: exam.examDate ? format(new Date(exam.examDate + 'T00:00:00'), 'yyyy-MM-dd') : '',
        });
    } else {
        form.reset({
            studentId: "",
            examDate: "",
            targetBelt: "",
            paymentAmount: 200,
            paymentStatus: 'Pendente',
            paymentMethod: 'Pendente',
        });
    }
  }, [isEditing, exam, allStudents, form]);


  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
        if (name === 'studentId' && values.studentId) {
            const student = allStudents.find(s => s.id === values.studentId);
            setSelectedStudent(student);
        }
    });
    return () => subscription.unsubscribe();
  }, [form, allStudents]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !selectedStudent) {
        toast({ title: "Erro", description: "Aluno ou banco de dados não disponível.", variant: "destructive" });
        return;
    };

    const examId = isEditing && exam ? exam.id : doc(collection(firestore, "exams")).id;
    const studentAge = selectedStudent.dob ? differenceInYears(new Date(), new Date(selectedStudent.dob)) : 0;
    
    const examData: Omit<Exam, 'id'> = {
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        studentCpf: selectedStudent.cpf,
        studentAge: studentAge,
        examDate: values.examDate,
        targetBelt: values.targetBelt,
        paymentAmount: values.paymentAmount,
        paymentStatus: values.paymentStatus,
        paymentMethod: values.paymentMethod,
    };
    
    const docRef = doc(firestore, 'exams', examId);
    setDocumentNonBlocking(docRef, { ...examData, id: examId }, { merge: true });

    toast({
      title: isEditing ? "Inscrição Atualizada!" : "Inscrição Realizada!",
      description: `A inscrição para ${selectedStudent.name} foi salva com sucesso.`,
    })
    
    router.push('/exames');
    router.refresh();
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>{isEditing ? "Editar Inscrição de Exame" : "Inscrever Aluno em Exame"}</CardTitle>
          <CardDescription>
            {isEditing ? "Altere os dados da inscrição e do pagamento." : "Selecione o aluno e preencha os detalhes do exame."}
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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
                        name="examDate"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Data do Exame</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="targetBelt"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Faixa Pretendida</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Amarela">Amarela</SelectItem>
                                    <SelectItem value="Laranja">Laranja</SelectItem>
                                    <SelectItem value="Verde">Verde</SelectItem>
                                    <SelectItem value="Azul">Azul</SelectItem>
                                    <SelectItem value="Marrom">Marrom</SelectItem>
                                    <SelectItem value="Preta">Preta</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
               
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="paymentAmount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Valor da Inscrição (R$)</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="paymentStatus"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Status do Pagamento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Pago">Pago</SelectItem>
                                <SelectItem value="Pendente">Pendente</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Forma de Pagamento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
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

                <Button type="submit" className="w-full mt-4">{isEditing ? "Salvar Alterações" : "Inscrever Aluno"}</Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  )
}

    