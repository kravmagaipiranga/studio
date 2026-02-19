
'use client';

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { collection, doc } from 'firebase/firestore';
import { useFirestore, addDocumentNonBlocking } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { GiftCardOrder } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, Loader2, ArrowRight, ArrowLeft } from "lucide-react";

const formSchema = z.object({
  buyerName: z.string().min(3, "Nome completo é obrigatório."),
  buyerEmail: z.string().email("E-mail inválido."),
  buyerPhone: z.string().min(10, "WhatsApp é obrigatório."),
  buyerCpf: z.string().min(11, "CPF inválido."),
  recipientName: z.string().min(2, "Nome do presenteado é obrigatório."),
  message: z.string().optional(),
  paymentMethod: z.enum(["Pix", "Boleto"]),
});

type FormValues = z.infer<typeof formSchema>;

export function GiftCardForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      buyerName: "",
      buyerEmail: "",
      buyerPhone: "",
      buyerCpf: "",
      recipientName: "",
      message: "",
      paymentMethod: "Pix",
    },
  });

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    if (step === 1) fieldsToValidate = ["buyerName", "buyerEmail", "buyerPhone", "buyerCpf"];
    if (step === 2) fieldsToValidate = ["recipientName"];

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  async function onSubmit(values: FormValues) {
    if (!firestore) return;
    setIsSubmitting(true);

    const orderData: Omit<GiftCardOrder, 'id'> = {
      ...values,
      status: 'Pendente',
      createdAt: new Date().toISOString(),
      totalValue: 330.00,
    };

    try {
      await addDocumentNonBlocking(collection(firestore, "giftCardOrders"), orderData);
      setIsSuccess(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao processar",
        description: "Ocorreu um problema. Por favor, tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-10 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Pedido Realizado com Sucesso!</h2>
          <div className="space-y-4 text-muted-foreground text-left max-w-md mx-auto">
            <p><strong>1. Confirmação:</strong> Você receberá um e-mail com as instruções de pagamento.</p>
            <p><strong>2. Envio:</strong> Após a confirmação, o Gift Card digital será enviado para o seu e-mail.</p>
            <p><strong>3. Agendamento:</strong> O presenteado poderá agendar a aula através do nosso WhatsApp.</p>
          </div>
          <Button className="mt-8" variant="outline" onClick={() => window.location.reload()}>Fazer novo pedido</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-primary/10">
      <CardHeader className="bg-muted/30 rounded-t-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Passo {step} de 3</span>
          <span className="text-sm font-semibold text-primary">R$ 330,00</span>
        </div>
        <CardTitle>
          {step === 1 && "Dados do Comprador"}
          {step === 2 && "Dados do Presenteado"}
          {step === 3 && "Pagamento"}
        </CardTitle>
        <CardDescription>
          {step === 1 && "Quem está presenteando?"}
          {step === 2 && "Para quem é o presente?"}
          {step === 3 && "Escolha como deseja pagar."}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <FormField
                  control={form.control}
                  name="buyerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl><Input placeholder="Seu nome" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="buyerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl><Input type="email" placeholder="seu@email.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="buyerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl><Input placeholder="(11) 99999-9999" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="buyerCpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <FormField
                  control={form.control}
                  name="recipientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Presenteado</FormLabel>
                      <FormControl><Input placeholder="Como deve aparecer no Gift Card" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensagem Personalizada (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ex: Para que você se sinta sempre segura. Com amor, Thiago." 
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Método de Pagamento</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0 p-4 border rounded-md cursor-pointer hover:bg-accent">
                            <FormControl><RadioGroupItem value="Pix" /></FormControl>
                            <FormLabel className="font-normal cursor-pointer w-full">Pagamento via PIX (Aprovação Imediata)</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 p-4 border rounded-md cursor-pointer hover:bg-accent">
                            <FormControl><RadioGroupItem value="Boleto" /></FormControl>
                            <FormLabel className="font-normal cursor-pointer w-full">Boleto Bancário (1-3 dias úteis)</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="p-4 bg-muted rounded-md text-sm text-muted-foreground">
                  <p>Ao clicar em finalizar, seu pedido será processado e as instruções de pagamento serão enviadas para <strong>{form.getValues('buyerEmail')}</strong>.</p>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t">
              {step > 1 ? (
                <Button type="button" variant="ghost" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
              ) : <div></div>}
              
              {step < 3 ? (
                <Button type="button" onClick={nextStep} className="bg-primary hover:bg-primary/90">
                  Próximo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 min-w-[140px]">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Finalizar Pedido"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
