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
import { CheckCircle, Loader2, ArrowRight, ArrowLeft, Copy, QrCode } from "lucide-react";

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

  const copyPixKey = () => {
    navigator.clipboard.writeText("31116136000195");
    toast({
      title: "Chave Copiada!",
      description: "A chave CNPJ foi copiada para sua área de transferência.",
    });
  };

  if (isSuccess) {
    const method = form.getValues('paymentMethod');
    return (
      <Card className="border-green-200 bg-green-50/50 overflow-hidden">
        <CardContent className="p-10 text-center space-y-6">
          <div className="flex flex-col items-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold">Pedido Realizado!</h2>
            <p className="text-muted-foreground">Seu pedido foi registrado com sucesso.</p>
          </div>

          {method === 'Pix' ? (
            <div className="space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-border inline-block mx-auto">
                {/* QR Code Placeholder for the provided image logic */}
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126360014BR.GOV.BCB.PIX0114311161360001955204000053039865802BR5925Centro%20Treinamento%20Krav%20Maga6009Sao%20Paulo62070503***6304E2B1" 
                  alt="QR Code PIX" 
                  className="w-48 h-48 mx-auto"
                />
                <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest font-bold">Escaneie para pagar</p>
              </div>

              <div className="p-4 bg-white rounded-lg border border-primary/20 max-w-sm mx-auto">
                <p className="text-xs font-semibold text-primary uppercase mb-2">Chave CNPJ (Pix)</p>
                <div className="flex items-center justify-between gap-2 bg-muted p-2 rounded border">
                  <code className="text-sm font-bold truncate">31.116.136/0001-95</code>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={copyPixKey}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-2 max-w-sm mx-auto">
                <p>Após o pagamento, envie o comprovante se desejar agilizar a liberação.</p>
                <p>O Gift Card digital será enviado para <strong>{form.getValues('buyerEmail')}</strong> em até 24h úteis após a compensação.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-md mx-auto">
              <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-lg font-semibold text-blue-900 leading-tight">
                  O boleto será enviado no seu e-mail ou WhatsApp informado em breve.
                </p>
              </div>
              <div className="text-sm text-muted-foreground space-y-4 text-left">
                <p><strong>Próximos passos:</strong></p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Verifique sua caixa de entrada e pasta de spam.</li>
                  <li>O boleto pode levar até 1 hora para ser gerado por nossa equipe.</li>
                  <li>Após o pagamento, o banco leva de 1 a 3 dias úteis para confirmar.</li>
                </ul>
              </div>
            </div>
          )}

          <div className="pt-6 border-t flex flex-col gap-2">
            <Button className="w-full" onClick={() => window.location.reload()}>Fazer novo pedido</Button>
            <Button variant="ghost" className="w-full" onClick={() => window.print()}>Imprimir Confirmação</Button>
          </div>
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
                  <p>Ao clicar em finalizar, seu pedido será processado e as instruções de pagamento serão exibidas a seguir para o método <strong>{form.watch('paymentMethod')}</strong>.</p>
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
