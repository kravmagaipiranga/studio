'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { collection, doc } from 'firebase/firestore';
import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, useFirestore } from "@/firebase";
import { Card, CardContent } from "@/components/ui/card";

const registrationSchema = z.object({
  name: z.string().min(3, "O nome completo é obrigatório."),
  dob: z.string().refine((val) => val, { message: "A data de nascimento é obrigatória." }),
  cpf: z.string().min(11, "O CPF deve ter 11 dígitos.").max(14, "Formato de CPF inválido."),
  phone: z.string().min(10, "O número de telefone/WhatsApp é obrigatório."),
  email: z.string().email("Por favor, insira um endereço de e-mail válido."),
  tshirtSize: z.string().min(1, "Selecione um tamanho de camiseta."),
  pantsSize: z.string().min(1, "Selecione um tamanho de calça."),
});

export function PublicRegistrationForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof registrationSchema>>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      dob: "",
      cpf: "",
      phone: "",
      email: "",
      tshirtSize: "",
      pantsSize: "",
    },
  });

  async function onSubmit(values: z.infer<typeof registrationSchema>) {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "Erro de Conexão",
        description: "Não foi possível conectar ao banco de dados. Tente novamente.",
      });
      return;
    }
    
    setIsSubmitting(true);

    const newStudentId = doc(collection(firestore, "students")).id;
    
    const studentData = {
      ...values,
      id: newStudentId,
      status: 'Pendente' as const,
      belt: 'Branca',
      paymentStatus: 'Pendente' as const,
      registrationDate: new Date().toISOString(),
      planType: 'Mensal' as const,
      planValue: 315,
    };

    try {
      await addDocumentNonBlocking(collection(firestore, 'students'), studentData);
      setIsSuccess(true);
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Erro ao Enviar",
        description: "Não foi possível completar seu cadastro. Por favor, tente novamente.",
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
        <Card>
            <CardContent className="p-10 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Cadastro Enviado!</h2>
                <p className="text-muted-foreground">
                    Suas informações foram recebidas com sucesso. Em breve, a administração entrará em contato para finalizar sua matrícula.
                </p>
            </CardContent>
        </Card>
    )
  }


  return (
    <Card>
        <CardContent className="p-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <FormField
                            control={form.control}
                            name="tshirtSize"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tamanho da Camiseta</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: M, G, 12, etc." {...field} />
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
                                    <Input placeholder="Ex: 42, M, G, etc." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                    
                    <div className="flex justify-end pt-4">
                        <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? "Enviando..." : "Enviar Cadastro"}
                        </Button>
                    </div>
                </form>
            </Form>
        </CardContent>
    </Card>
  )
}
