
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect } from "react";
import { collection, doc } from 'firebase/firestore'
import { useRouter } from "next/navigation"
import { differenceInYears, format } from "date-fns"

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
import { Seminar, Student } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Combobox } from "../ui/combobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const formSchema = z.object({
  studentId: z.string({ required_error: "É necessário selecionar um aluno." }),
  topic: z.string().min(3, "O tema é obrigatório."),
  paymentAmount: z.preprocess(
    (a) => {
        if (typeof a === 'string') return parseFloat(a.replace(',', '.'));
        return a;
    },
    z.number().positive("O valor deve ser positivo.")
  ),
  paymentStatus: z.enum(["Pago", "Pendente"]),
  paymentDate: z.string().optional(),
  paymentMethod: z.enum(["Pix", "Cartão", "Dinheiro", "Pendente"]),
});

interface SeminarFormProps {
  seminar?: Seminar | null;
  allStudents: Student[];
  isEditing: boolean;
}

export function SeminarForm({ seminar, allStudents, isEditing }: SeminarFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const firestore = useFirestore();

  const sortedStudents = allStudents.slice().sort((a, b) => a.name.localeCompare(b.name));
  const studentOptions = sortedStudents.map(s => ({ value: s.id, label: s.name }));
  const paymentStatus = form.watch("paymentStatus");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: "",
      topic: "",
      paymentAmount: 100,
      paymentStatus: 'Pendente',
      paymentDate: "",
      paymentMethod: 'Pendente',
    },
  });

  useEffect(() => {
     if (isEditing && seminar) {
        form.reset({
          studentId: seminar.studentId || "",
          topic: seminar.topic || "",
          paymentAmount: seminar.paymentAmount || 100,
          paymentStatus: seminar.paymentStatus || 'Pendente',
          paymentDate: seminar.paymentDate ? format(new Date(seminar.paymentDate + 'T00:00:00'), 'yyyy-MM-dd') : '',
          paymentMethod: seminar.paymentMethod || 'Pendente',
        });
     } else {
        form.reset({
            studentId: "",
            topic: "",
            paymentAmount: 100,
            paymentStatus: 'Pendente',
            paymentDate: "",
            paymentMethod: 'Pendente',
        });
     }
  }, [isEditing, seminar, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
        toast({ title: "Erro", description: "Banco de dados não disponível.", variant: "destructive" });
        return;
    };
    const selectedStudent = allStudents.find(s => s.id === values.studentId);
    if (!selectedStudent) {
        toast({ title: "Erro", description: "Aluno não encontrado.", variant: "destructive" });
        return;
    }

    const seminarId = isEditing && seminar ? seminar.id : doc(collection(firestore, "seminars")).id;
    const studentAge = selectedStudent.dob ? differenceInYears(new Date(), new Date(selectedStudent.dob)) : 0;
    
    const seminarData = {
        ...values,
        id: seminarId,
        studentName: selectedStudent.name,
        studentBelt: selectedStudent.belt,
        studentCpf: selectedStudent.cpf,
        studentAge: studentAge,
        paymentDate: values.paymentStatus === 'Pago' ? values.paymentDate : undefined,
    };
    
    const docRef = doc(firestore, 'seminars', seminarId);
    setDocumentNonBlocking(docRef, seminarData, { merge: true });

    toast({
      title: isEditing ? "Inscrição Atualizada!" : "Inscrição Realizada!",
      description: `A inscrição de ${selectedStudent.name} no seminário foi salva.`,
    })
    
    router.push('/seminarios');
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>{isEditing ? "Editar Inscrição" : "Inscrever Aluno em Seminário/Curso"}</CardTitle>
          <CardDescription>
            {isEditing ? "Altere os dados da inscrição e do pagamento." : "Selecione o aluno e preencha os detalhes."}
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                 <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tema do Seminário/Curso</FormLabel>
                        <FormControl>
                            <Input placeholder="Ex: Defesa contra Ameaça de Faca" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

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
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="paymentDate"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Data do Pagamento</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} value={field.value ?? ''} disabled={paymentStatus !== 'Pago'} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
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
                </div>

                <Button type="submit" className="w-full mt-4">{isEditing ? "Salvar Alterações" : "Inscrever Aluno"}</Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  )
}
