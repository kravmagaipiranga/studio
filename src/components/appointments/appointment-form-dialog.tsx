
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect } from "react"
import { collection, doc } from "firebase/firestore"
import { format } from "date-fns"

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
import { useToast } from "@/hooks/use-toast"
import { Appointment } from "@/lib/types"
import { useFirestore, setDocumentNonBlocking } from "@/firebase"
import { Textarea } from "../ui/textarea"

const formSchema = z.object({
  name: z.string().min(2, "O nome é obrigatório."),
  whatsapp: z.string().min(10, "O WhatsApp é obrigatório."),
  email: z.string().email("E-mail inválido.").optional().or(z.literal('')),
  classDate: z.string().refine((val) => val, {
    message: "A data da aula é obrigatória.",
  }),
  classTime: z.string().refine((val) => val, {
    message: "O horário da aula é obrigatório.",
  }),
  notes: z.string().optional(),
})

interface AppointmentFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  appointment?: Appointment;
}

export function AppointmentFormDialog({
  isOpen,
  onOpenChange,
  appointment,
}: AppointmentFormDialogProps) {
  const { toast } = useToast()
  const firestore = useFirestore();
  const isEditing = !!appointment;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (isOpen) {
        form.reset(appointment ? {
            ...appointment,
            classDate: appointment.classDate ? format(new Date(appointment.classDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        } : {
            name: '',
            whatsapp: '',
            email: '',
            classDate: format(new Date(), 'yyyy-MM-dd'),
            classTime: '19:00',
            notes: '',
        })
    }
  }, [appointment, isOpen, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
        toast({ title: "Erro", description: "Banco de dados não disponível.", variant: "destructive" });
        return;
    }

    const appointmentId = isEditing ? appointment.id : doc(collection(firestore, "appointments")).id;
    const appointmentRef = doc(firestore, 'appointments', appointmentId);

    const appointmentData: Appointment = {
        ...values,
        id: appointmentId,
    };
    
    setDocumentNonBlocking(appointmentRef, appointmentData, { merge: true });
    
    toast({
      title: isEditing ? "Agendamento Atualizado!" : "Agendamento Registrado!",
      description: `O agendamento para ${values.name} foi salvo com sucesso.`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
          <DialogDescription>
            Preencha os dados para uma nova aula experimental ou outro evento.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Interessado</FormLabel>
                  <FormControl><Input placeholder="Nome completo" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                  <FormControl><Input placeholder="(11) 99999-9999" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail (Opcional)</FormLabel>
                  <FormControl><Input type="email" placeholder="interessado@email.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="classDate"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Data</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="classTime"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Horário</FormLabel>
                        <FormControl><Input type="time" {...field} /></FormControl>
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
                  <FormLabel>Anotações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Alguma observação importante?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit">Salvar Agendamento</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

    