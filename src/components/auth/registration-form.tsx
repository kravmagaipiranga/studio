"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

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

const formSchema = z.object({
  fullName: z.string().min(2, "O nome completo deve ter pelo menos 2 caracteres."),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), "Por favor, insira uma data válida."),
  cpf: z.string().min(11, "CPF deve ter 11 dígitos.").max(14, "CPF inválido."),
  tshirtSize: z.string().min(1, "Selecione o tamanho da camiseta."),
  pantsSize: z.string().min(1, "Selecione o tamanho da calça."),
  phone: z.string().min(10, "Por favor, insira um número de telefone válido."),
  email: z.string().email("Por favor, insira um endereço de e-mail válido."),
  emergencyContacts: z.string().min(10, "Por favor, insira os contatos de emergência.")
})

export function RegistrationForm() {
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      cpf: "",
      tshirtSize: "",
      pantsSize: "",
      emergencyContacts: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    toast({
      title: "Cadastro Enviado!",
      description: "Recebemos suas informações e entraremos em contato em breve.",
    })
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
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
                <FormControl>
                    <Input placeholder="P, M, G, etc." {...field} />
                </FormControl>
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
                <FormControl>
                    <Input placeholder="38, 40, 42, etc." {...field} />
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
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
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
        <Button type="submit" className="w-full mt-4">Criar uma conta</Button>
      </form>
    </Form>
  )
}
