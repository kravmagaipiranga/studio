
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { collection, doc } from 'firebase/firestore'
import { useRouter } from "next/navigation"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFirestore, setDocumentNonBlocking } from "@/firebase"
import { Student } from "@/lib/types"


const formSchema = z.object({
  name: z.string().min(2, "O nome completo deve ter pelo menos 2 caracteres."),
  dob: z.string().refine((val) => val, {
    message: "A data de nascimento é obrigatória.",
  }),
  cpf: z.string().min(11, "O CPF deve ter pelo menos 11 dígitos.").max(14, "Formato de CPF inválido."),
  phone: z.string().min(10, "O número de telefone/WhatsApp é obrigatório."),
  email: z.string().email("Por favor, insira um endereço de e-mail válido."),
  tshirtSize: z.string().min(1, "Selecione um tamanho de camiseta."),
  pantsSize: z.string().min(1, "Selecione um tamanho de calça."),
  emergencyContacts: z.string().optional(),
  belt: z.string().min(1, "A faixa é obrigatória"),
  status: z.string().min(1, "O status é obrigatório"),
  paymentStatus: z.string().min(1, "O status de pagamento é obrigatório."),
  generalNotes: z.string().optional(),
  medicalHistory: z.string().optional(),
})

interface StudentFormProps {
  student?: Student;
}

export function StudentForm({ student }: StudentFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const firestore = useFirestore();

  const isEditing = !!student;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: student ? {
        ...student,
        dob: student.dob ? student.dob.split('T')[0] : '',
        status: student.status || 'Ativo',
        paymentStatus: student.paymentStatus || 'Pendente',
        emergencyContacts: student.emergencyContacts || '',
        generalNotes: student.generalNotes || '',
        medicalHistory: student.medicalHistory || '',
    } : {
      name: "",
      dob: "",
      cpf: "",
      phone: "",
      email: "",
      tshirtSize: "",
      pantsSize: "",
      emergencyContacts: "",
      belt: 'Branca',
      status: 'Ativo',
      paymentStatus: 'Pendente',
      generalNotes: "",
      medicalHistory: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "Erro de Conexão",
        description: "Não foi possível conectar ao banco de dados. Tente novamente.",
      });
      return;
    }
    
    const studentId = isEditing ? student.id : doc(collection(firestore, "students")).id;
    
    const studentData: Partial<Student> = {
        ...values,
        id: studentId,
        avatar: student?.avatar || `https://picsum.photos/seed/${studentId}/100/100`,
        registrationDate: student?.registrationDate || new Date().toISOString(),
    }

    const docRef = doc(firestore, 'students', studentId);
    setDocumentNonBlocking(docRef, studentData, { merge: true });

    toast({
      title: isEditing ? "Aluno Atualizado!" : "Cadastro Enviado com Sucesso!",
      description: isEditing ? "Os dados do aluno foram atualizados." : "O novo aluno foi adicionado.",
    })
    
    if (isEditing) {
        router.push(`/alunos/${studentId}`);
    } else {
        router.push('/alunos');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo do aluno" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Data de Nascimento</FormLabel>
                <FormControl>
                    <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
                <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                    <Input placeholder="000.000.000-00" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Telefone / WhatsApp</FormLabel>
                  <FormControl>
                      <Input type="tel" placeholder="(11) 99999-9999" {...field} />
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
                  <FormLabel>Email</FormLabel>
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
                name="belt"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Faixa</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Branca">Branca</SelectItem>
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
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status do Aluno</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
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
              name="tshirtSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tamanho da Camiseta</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="8 anos">8 anos</SelectItem>
                        <SelectItem value="10 anos">10 anos</SelectItem>
                        <SelectItem value="12 anos">12 anos</SelectItem>
                        <SelectItem value="14 anos">14 anos</SelectItem>
                        <SelectItem value="PP">PP</SelectItem>
                        <SelectItem value="P">P</SelectItem>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="G">G</SelectItem>
                        <SelectItem value="GG">GG</SelectItem>
                        <SelectItem value="XGG">XGG</SelectItem>
                        <SelectItem value="XXGG">XXGG</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          <FormField
              control={form.control}
              name="pantsSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tamanho da Calça</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="12">12</SelectItem>
                        <SelectItem value="PP">PP</SelectItem>
                        <SelectItem value="P">P</SelectItem>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="G">G</SelectItem>
                        <SelectItem value="GG">GG</SelectItem>
                        <SelectItem value="EGG">EGG</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        
        <FormField
          control={form.control}
          name="emergencyContacts"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contatos de Emergência (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Nome, parentesco e telefone de um ou mais contatos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="medicalHistory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Histórico Médico (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Alergias, condições pré-existentes, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="generalNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Anotações Gerais (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Qualquer outra observação relevante." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full mt-4">{isEditing ? "Salvar Alterações" : "Finalizar Cadastro"}</Button>
      </form>
    </Form>
  )
}

    