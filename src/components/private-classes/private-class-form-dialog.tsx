
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useMemo } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { PrivateClass, Student } from "@/lib/types"
import { Combobox } from "@/components/ui/combobox"
import { useFirestore, setDocumentNonBlocking } from "@/firebase"

const formSchema = z.object({
  studentId: z.string({ required_error: "É necessário selecionar um aluno." }),
  classDate: z.string().refine((val) => val, { message: "A data da aula é obrigatória." }),
  paymentAmount: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive("O valor deve ser positivo.")
  ),
  paymentMethod: z.enum(["Pix", "Cartão", "Dinheiro", "Pendente"]),
  paymentStatus: z.enum(["Pago", "Pendente"]),
})

interface PrivateClassFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  privateClass?: PrivateClass;
  allStudents: Student[];
}

export function PrivateClassFormDialog({
  isOpen,
  onOpenChange,
  privateClass,
  allStudents = []
}: PrivateClassFormDialogProps) {
  const { toast } = useToast()
  const firestore = useFirestore();
  const isEditing = !!privateClass;

  const studentOptions = useMemo(() => 
    allStudents.map(s => ({ value: s.id, label: s.name })),
    [allStudents]
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethod: "Pendente",
      paymentStatus: "Pendente",
    }
  });

  useEffect(() => {
    if (isOpen) {
        form.reset(privateClass ? {
            ...privateClass,
            paymentAmount: privateClass.paymentAmount || 0,
            classDate: privateClass.classDate ? format(new Date(privateClass.classDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        } : {
            studentId: '',
            classDate: format(new Date(), 'yyyy-MM-dd'),
            paymentAmount: 0,
            paymentMethod: "Pendente",
            paymentStatus: "Pendente",
        })
    }
  }, [privateClass, isOpen, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
        toast({ title: "Erro", description: "Banco de dados não disponível.", variant: "destructive" });
        return;
    }
    const student = allStudents.find(s => s.id === values.studentId);
    if (!student) {
        toast({ title: "Erro", description: "Aluno não encontrado.", variant: "destructive" });
        return;
    }

    const classId = isEditing ? privateClass.id : doc(collection(firestore, "privateClasses")).id;
    const classRef = doc(firestore, 'privateClasses', classId);

    const classData: PrivateClass = {
        ...values,
        id: classId,
        studentName: student.name,
        studentBelt: student.belt,
    };
    
    setDocumentNonBlocking(classRef, classData, { merge: true });
    
    toast({
      title: isEditing ? "Aula Atualizada!" : "Aula Agendada!",
      description: `A aula para ${student.name} foi salva com sucesso.`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Aula Particular' : 'Agendar Nova Aula'}</DialogTitle>
          <DialogDescription>
            Preencha as informações para agendar a aula.
          </DialogDescription>
        </DialogHeader>
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
                        disabled={isEditing}
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
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
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
             <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormLabel>Forma Pgto.</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit">Salvar Aula</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
    