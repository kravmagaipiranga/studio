
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
import { Sale, Student } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Combobox } from "../ui/combobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";


const formSchema = z.object({
  studentId: z.string({ required_error: "É necessário selecionar um aluno." }),
  item: z.string().min(2, "O nome do item é obrigatório."),
  value: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive("O valor deve ser positivo.")
  ),
  date: z.string().refine((val) => val, { message: "A data da venda é obrigatória." }),
  paymentStatus: z.enum(["Pago", "Pendente"]),
  paymentMethod: z.enum(["Pix", "Cartão", "Dinheiro", "Pendente"]),
})

interface SaleFormProps {
  sale?: Sale;
  allStudents: Student[];
}

export function SaleForm({ sale, allStudents }: SaleFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const firestore = useFirestore();
  const isEditing = !!sale;

  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>(undefined);
  const studentOptions = allStudents.map(s => ({ value: s.id, label: s.name }));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: sale ? {
        ...sale,
        date: sale.date ? format(new Date(sale.date + 'T00:00:00'), 'yyyy-MM-dd') : '',
    } : {
      studentId: "",
      item: "",
      value: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      paymentStatus: 'Pendente',
      paymentMethod: 'Pendente',
    },
  })

  useEffect(() => {
     if (isEditing && sale) {
        const student = allStudents.find(s => s.id === sale.studentId);
        setSelectedStudent(student);
     }
  }, [isEditing, sale, allStudents])


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

    const saleId = isEditing ? sale.id : doc(collection(firestore, "sales")).id;
    
    const saleData: Omit<Sale, 'id'> = {
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        item: values.item,
        value: values.value,
        date: values.date,
        paymentStatus: values.paymentStatus,
        paymentMethod: values.paymentMethod,
    };
    
    const docRef = doc(firestore, 'sales', saleId);
    setDocumentNonBlocking(docRef, { ...saleData, id: saleId }, { merge: true });

    toast({
      title: isEditing ? "Venda Atualizada!" : "Venda Registrada!",
      description: `A venda para ${selectedStudent.name} foi salva com sucesso.`,
    })
    
    router.push('/vendas');
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>{isEditing ? "Editar Venda" : "Registrar Nova Venda"}</CardTitle>
          <CardDescription>
            {isEditing ? "Altere os dados da venda e do pagamento." : "Selecione o aluno e preencha os detalhes da venda."}
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
                        name="item"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Item Vendido</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Uniforme Completo" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="value"
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
                </div>
                
                 <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Data da Venda</FormLabel>
                        <FormControl>
                            <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
               
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <Button type="submit" className="w-full mt-4">{isEditing ? "Salvar Alterações" : "Registrar Venda"}</Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  )
}
