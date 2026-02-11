'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { collection, doc } from 'firebase/firestore';
import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, useFirestore } from "@/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";

const registrationSchema = z.object({
  name: z.string().min(3, "O nome completo é obrigatório."),
  dob: z.string().refine((val) => val, { message: "A data de nascimento é obrigatória." }),
  cpf: z.string().min(11, "O CPF deve ter 11 dígitos.").max(14, "Formato de CPF inválido."),
  phone: z.string().min(10, "O número de telefone/WhatsApp é obrigatório."),
  email: z.string().email("Por favor, insira um endereço de e-mail válido."),
  tshirtSize: z.string().min(1, "Selecione um tamanho de camiseta."),
  pantsSize: z.string().min(1, "Selecione um tamanho de calça."),
  emergencyContacts: z.string().optional(),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "Você deve ler e aceitar os termos e condições." }),
  }),
  veracityDeclared: z.literal(true, {
    errorMap: () => ({ message: "Você deve declarar a veracidade das informações." }),
  }),
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
      emergencyContacts: "",
      termsAccepted: false,
      veracityDeclared: false,
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
    
    const { termsAccepted, veracityDeclared, ...studentValues } = values;

    const studentData = {
      ...studentValues,
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
    <>
        <Card className="mb-8">
            <CardContent className="p-6 text-sm text-muted-foreground">
                <h3 className="font-semibold mb-4 text-base text-foreground">Seja bem-vindo ao Centro de Treinamento de Krav Magá Ipiranga! Ao se matricular você está ciente que:</h3>
                <ol className="list-decimal list-inside space-y-3">
                    <li>Haverá desconto no valor da mensalidade apenas para pagamentos realizados até o dia 05 de cada mês (verificar valores no ato da matrícula). Para obter o desconto não serão considerados os dias úteis. Assim, se o dia 05 do mês coincidir com finais de semana, feriados ou dias que você não treina, o pagamento deverá ser efetuado em data anterior, em dinheiro, pix, transferência bancária ou boleto bancário.</li>
                    <li>A partir do dia 15 de cada mês, o aluno que não estiver em dia com a mensalidade não poderá frequentar os treinos até a regularização desta.</li>
                    <li>No caso de desistências, os pagamentos efetuados não serão devolvidos, inclusive nos casos referentes aos planos trimestrais.</li>
                    <li>Em casos de faltas e feriados, as aulas poderão ser repostas em qualquer momento, observando a graduação e os horários das mesmas.</li>
                    <li>Em caso de ausência e licenças médicas, o instrutor deve ser informado para que seja realizada a reposição das aulas perdidas ou o congelamento do plano.</li>
                    <li>O aluno que se ausentar por um período superior a um (01) mês deverá pagar a rematrícula na ocasião de sua volta, exceto para os casos de licença médica, ou mediante aviso prévio da suspensão das aulas por parte do aluno (congelamento). Congelamentos serão permitidos uma única vez ao ano.</li>
                    <li>O Krav Maga é uma atividade de contato, e desta forma a Federação Internacional de Krav Magá bem como seus instrutores estão isentos de qualquer responsabilidade por danos físicos que venham a sofrer os alunos durante os treinos em decorrência de sua natureza e fruição.</li>
                </ol>
            </CardContent>
        </Card>
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
                        
                        <FormField
                            control={form.control}
                            name="emergencyContacts"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contatos de Emergência</FormLabel>
                                <FormControl>
                                <Textarea
                                    placeholder="Nome, parentesco e telefone de um ou mais contatos"
                                    {...field}
                                    value={field.value ?? ''}
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="termsAccepted"
                            render={({ field }) => (
                                <FormItem className="space-y-3 rounded-md border p-4">
                                    <div className="flex items-center space-x-3">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                id="terms"
                                            />
                                        </FormControl>
                                        <label
                                            htmlFor="terms"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            Li e aceito os termos e condições do contrato.
                                        </label>
                                    </div>
                                    <FormDescription>
                                        Atenção: Marcar a opção “Li e aceito os termos e condições do contrato” neste formulário de inscrição, representa sua assinatura eletrônica e possui a mesma validade jurídica de uma assinatura em um documento impresso. Assim, você estará concordando com todos os termos, itens e cláusulas deste contrato.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="veracityDeclared"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        id="veracity"
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <label htmlFor="veracity" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                            Declaro que todas as informações fornecidas neste formulário são verdadeiras e precisas.
                                        </label>
                                        <FormMessage />
                                    </div>
                                </FormItem>
                            )}
                        />


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
    </>
  )
}
