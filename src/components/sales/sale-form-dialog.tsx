
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
import { Sale, Student } from "@/lib/types"
import { Combobox } from "@/components/ui/combobox"
import { useFirestore, setDocumentNonBlocking } from "@/firebase"

const formSchema = z.object({
  studentId: z.string({ required_error: "É necessário selecionar um aluno." }),
  item: z.string().min(2, "O nome do item é obrigatório."),
  value: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive("O valor deve ser positivo.")
  ),
  date: z.string().refine((val) => val, {
    message: "A data da venda é obrigatória.",
  }),
  paymentMethod: z.enum(["Pix", "Cartão", "Dinheiro", "Pendente"]),
  paymentStatus: z.enum(["Pago", "Pendente"]),
})

interface SaleFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  sale?: Sale;
  allStudents: Student[];
}

export function SaleFormDialog({
  isOpen,
  onOpenChange,
  sale,
  allStudents = []
}: SaleFormDialogProps) {
  const { toast } = useToast()
  const firestore = useFirestore();
  const isEditing = !!sale;

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
        form.reset(sale ? {
            ...sale,
            value: sale.value || 0,
            date: sale.date ? format(new Date(sale.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        } : {
            studentId: '',
            item: '',
            value: 0,
            date: format(new Date(), 'yyyy-MM-dd'),
            paymentMethod: "Pendente",
            paymentStatus: "Pendente",
        })
    }
  }, [sale, isOpen, form]);

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

    const saleId = isEditing ? sale.id : doc(collection(firestore, "sales")).id;
    const saleRef = doc(firestore, 'sales', saleId);

    const saleData: Sale = {
        ...values,
        id: saleId,
        studentName: student.name,
    };
    
    setDocumentNonBlocking(saleRef, saleData, { merge: true });
    
    toast({
      title: isEditing ? "Venda Atualizada!" : "Venda Registrada!",
      description: `A venda para ${student.name} foi salva com sucesso.`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Venda' : 'Registrar Nova Venda'}</DialogTitle>
          <DialogDescription>
            Preencha as informações para registrar a venda.
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
              name="item"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Vendido</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Camiseta, Calça, Luva" {...field} />
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
              <Button type="submit">Salvar Venda</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
    