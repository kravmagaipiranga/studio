
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { collection, doc, setDoc } from 'firebase/firestore'
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
  emergencyContacts: z.string().min(10, "Por favor, insira pelo menos um contato de emergência.")
})

export function RegistrationForm() {
  const { toast } = useToast()
  const router = useRouter()
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      dob: "",
      cpf: "",
      phone: "",
      email: "",
      tshirtSize: "",
      pantsSize: "",
      emergencyContacts: "",
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
    
    const studentsCollection = collection(firestore, "students");
    const newStudentId = doc(studentsCollection).id;

    const newStudent: Omit<Student, 'id'> = {
      ...values,
      belt: 'Branca',
      avatar: `https://picsum.photos/seed/${newStudentId}/100/100`,
      status: 'Ativo',
      paymentStatus: 'Pendente',
      registrationDate: new Date().toISOString(),
    };

    const docRef = doc(firestore, 'students', newStudentId);
    setDocumentNonBlocking(docRef, { ...newStudent, id: newStudentId }, { merge: true });

    toast({
      title: "Cadastro Enviado com Sucesso!",
      description: "Seus dados foram recebidos. Em breve, você estará pronto para começar.",
    })
    form.reset();
    
    router.push('/alunos');
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
                <Input placeholder="Seu nome completo" {...field} />
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
                      <SelectItem value="P">P</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="G">G</SelectItem>
                      <SelectItem value="GG">GG</SelectItem>
                      <SelectItem value="XG">XG</SelectItem>
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
                      <SelectItem value="36">36</SelectItem>
                      <SelectItem value="38">38</SelectItem>
                      <SelectItem value="40">40</SelectItem>
                      <SelectItem value="42">42</SelectItem>
                      <SelectItem value="44">44</SelectItem>
                      <SelectItem value="46">46</SelectItem>
                      <SelectItem value="48">48</SelectItem>
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
                      <Input type="email" placeholder="seu@email.com" {...field} />
                  </FormControl>
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
              <FormLabel>Contatos de Emergência</FormLabel>
              <FormControl>
                <Textarea placeholder="Nome, parentesco e telefone de um ou mais contatos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full mt-4">Finalizar Cadastro</Button>
      </form>
    </Form>
  )
}
