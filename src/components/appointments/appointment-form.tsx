
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { collection, doc } from 'firebase/firestore'
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { useEffect } from "react"

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
import { Textarea } from "@/components/ui/textarea"
import { useFirestore, setDocumentNonBlocking } from "@/firebase"
import { Appointment } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"

const formSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  whatsapp: z.string().min(10, "O número de WhatsApp é obrigatório."),
  email: z.string().email("E-mail inválido.").optional().or(z.literal('')),
  classDate: z.string().refine((val) => val, { message: "A data da aula é obrigatória." }),
  classTime: z.string().refine((val) => val, { message: "O horário da aula é obrigatório." }),
  notes: z.string().optional(),
})

interface AppointmentFormProps {
  appointment?: Appointment | null;
  isEditing: boolean;
}

export function AppointmentForm({ appointment, isEditing }: AppointmentFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      whatsapp: "",
      email: "",
      classDate: "",
      classTime: "20:00",
      notes: "",
    },
  });

  useEffect(() => {
    if (isEditing && appointment) {
        form.reset({
            ...appointment,
            classDate: appointment.classDate ? format(new Date(appointment.classDate + 'T00:00:00'), 'yyyy-MM-dd') : '',
            email: appointment.email || '',
            notes: appointment.notes || '',
        });
    } else {
        form.reset({
            name: "",
            whatsapp: "",
            email: "",
            classDate: "",
            classTime: "20:00",
            notes: "",
        });
    }
  }, [appointment, isEditing, form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;

    const appointmentId = isEditing && appointment ? appointment.id : doc(collection(firestore, "appointments")).id;
    const appointmentData: Omit<Appointment, 'id'> = {
        ...values,
        email: values.email || '',
        notes: values.notes || '',
    };
    
    const docRef = doc(firestore, 'appointments', appointmentId);
    setDocumentNonBlocking(docRef, { ...appointmentData, id: appointmentId }, { merge: true });

    toast({
      title: isEditing ? "Agendamento Atualizado!" : "Agendamento Criado!",
      description: `O agendamento para ${values.name} foi salvo com sucesso.`,
    })
    
    router.push('/agendamentos');
    router.refresh();
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>{isEditing ? "Editar Agendamento" : "Novo Agendamento"}</CardTitle>
          <CardDescription>
            {isEditing ? "Altere os dados do agendamento abaixo." : "Preencha os dados para uma nova aula experimental."}
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nome do Interessado</FormLabel>
                    <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email (Opcional)</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="aluno@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="classDate"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Data da Aula</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="classTime"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Horário da Aula</FormLabel>
                            <FormControl>
                                <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Anotações (Opcional)</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Alguma observação sobre o aluno ou a aula..." {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <Button type="submit" className="w-full mt-4">{isEditing ? "Salvar Alterações" : "Criar Agendamento"}</Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  )
}

    