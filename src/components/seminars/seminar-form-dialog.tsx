
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useMemo } from "react"
import { collection, doc } from "firebase/firestore"
import { format, differenceInYears } from "date-fns"

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
import { Seminar, Student } from "@/lib/types"
import { Combobox } from "@/components/ui/combobox"
import { useFirestore, setDocumentNonBlocking } from "@/firebase"

const formSchema = z.object({
  studentId: z.string({ required_error: "É necessário selecionar um aluno." }),
  topic: z.string().min(3, "O tema do seminário é obrigatório."),
  paymentAmount: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive("O valor deve ser positivo.")
  ),
  paymentMethod: z.enum(["Pix", "Cartão", "Dinheiro", "Pendente"]),
  paymentStatus: z.enum(["Pago", "Pendente"]),
})

interface SeminarFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  seminar?: Seminar;
  allStudents: Student[];
}

export function SeminarFormDialog({
  isOpen,
  onOpenChange,
  seminar,
  allStudents = []
}: SeminarFormDialogProps) {
  const { toast } = useToast()
  const firestore = useFirestore();
  const isEditing = !!seminar;

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
        form.reset(seminar ? {
            ...seminar,
            paymentAmount: seminar.paymentAmount || 0,
        } : {
            studentId: '',
            topic: '',
            paymentAmount: 0,
            paymentMethod: "Pendente",
            paymentStatus: "Pendente",
        })
    }
  }, [seminar, isOpen, form]);

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

    const seminarId = isEditing ? seminar.id : doc(collection(firestore, "seminars")).id;
    const seminarRef = doc(firestore, 'seminars', seminarId);

    const studentAge = differenceInYears(new Date(), new Date(student.dob));

    const seminarData: Seminar = {
        ...values,
        id: seminarId,
        studentName: student.name,
        studentBelt: student.belt,
        studentCpf: student.cpf,
        studentAge: studentAge,
    };
    
    setDocumentNonBlocking(seminarRef, seminarData, { merge: true });
    
    toast({
      title: isEditing ? "Inscrição Atualizada!" : "Inscrição Registrada!",
      description: `A inscrição de ${student.name} no seminário foi salva com sucesso.`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Inscrição' : 'Nova Inscrição em Seminário'}</DialogTitle>
          <DialogDescription>
            Preencha os dados para inscrever um aluno em um seminário ou curso.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tema do Seminário/Curso</FormLabel>
                  <FormControl><Input placeholder="Ex: Defesa contra Ameaça de Faca" {...field} /></FormControl>
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
                        disabled={isEditing}
                    />
                    <FormMessage />
                    </FormItem>
                )}
            />
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
              <Button type="submit">Salvar Inscrição</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

    