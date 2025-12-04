
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useState } from "react";
import { collection, doc } from 'firebase/firestore'
import { useRouter } from "next/navigation"
import { format } from "date-fns"

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
import { PrivateClass, Student } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Combobox } from "../ui/combobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const formSchema = z.object({
  studentId: z.string({ required_error: "É necessário selecionar um aluno." }),
  classDate: z.string().refine((val) => val, { message: "A data da aula é obrigatória." }),
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

interface PrivateClassFormProps {
  privateClass?: PrivateClass | null;
  allStudents: Student[];
  isEditing: boolean;
}

export function PrivateClassForm({ privateClass, allStudents, isEditing }: PrivateClassFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const firestore = useFirestore();

  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>(undefined);
  const studentOptions = allStudents.map(s => ({ value: s.id, label: s.name }));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: "",
      classDate: "",
      paymentAmount: 150,
      paymentStatus: 'Pendente',
      paymentMethod: 'Pendente',
    },
  });

  useEffect(() => {
     if (isEditing && privateClass) {
        const student = allStudents.find(s => s.id === privateClass.studentId);
        setSelectedStudent(student);
        form.reset({
            studentId: privateClass.studentId || "",
            classDate: privateClass.classDate ? format(new Date(privateClass.classDate + 'T00:00:00'), 'yyyy-MM-dd') : '',
            paymentAmount: privateClass.paymentAmount || 150,
            paymentStatus: privateClass.paymentStatus || "Pendente",
            paymentMethod: privateClass.paymentMethod || "Pendente",
        });
     }
  }, [isEditing, privateClass, allStudents, form]);


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

    const privateClassId = isEditing && privateClass ? privateClass.id : doc(collection(firestore, "privateClasses")).id;
    
    const privateClassData: Omit<PrivateClass, 'id'> = {
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        studentBelt: selectedStudent.belt,
        classDate: values.classDate,
        paymentAmount: values.paymentAmount,
        paymentStatus: values.paymentStatus,
        paymentMethod: values.paymentMethod,
        paymentDate: privateClass?.paymentDate,
    };
    
    const docRef = doc(firestore, 'privateClasses', privateClassId);
    setDocumentNonBlocking(docRef, { ...privateClassData, id: privateClassId }, { merge: true });

    toast({
      title: isEditing ? "Aula Atualizada!" : "Aula Agendada!",
      description: `A aula para ${selectedStudent.name} foi salva com sucesso.`,
    })
    
    router.push('/aulas');
    router.refresh();
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>{isEditing ? "Editar Aula Particular" : "Agendar Nova Aula Particular"}</CardTitle>
          <CardDescription>
            {isEditing ? "Altere os dados da aula e do pagamento." : "Selecione o aluno e preencha os detalhes da aula."}
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
                
                <FormField
                    control={form.control}
                    name="classDate"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Data da Aula</FormLabel>
                        <FormControl>
                            <Input type="date" {...field} value={field.value ?? ''}/>
                        </FormControl>
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

                <Button type="submit" className="w-full mt-4">{isEditing ? "Salvar Alterações" : "Agendar Aula"}</Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  )
}
