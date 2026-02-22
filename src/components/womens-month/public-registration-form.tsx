
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { collection, doc } from 'firebase/firestore';
import { useState } from "react";
import { CheckCircle, Loader2, Star, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, useFirestore } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const registrationSchema = z.object({
  name: z.string().min(3, "O nome completo é obrigatório."),
  whatsapp: z.string().min(10, "O número de WhatsApp é obrigatório."),
  chosenClass: z.string().min(1, "Por favor, escolha uma turma."),
  hasCompanions: z.enum(["sim", "nao"]),
  companionNames: z.string().optional(),
});

type FormValues = z.infer<typeof registrationSchema>;

export function PublicWomensMonthForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      whatsapp: "",
      chosenClass: "",
      hasCompanions: "nao",
      companionNames: "",
    },
  });

  const hasCompanions = form.watch("hasCompanions");

  async function onSubmit(values: FormValues) {
    if (!firestore) return;
    setIsSubmitting(true);

    const currentYear = new Date().getFullYear();
    const targetYear = currentYear < 2026 ? 2026 : currentYear;
    const createdAt = new Date().toISOString();

    const registrations: any[] = [];

    // 1. Registro da Principal
    const mainId = doc(collection(firestore, "womensMonth")).id;
    registrations.push({
      id: mainId,
      name: values.name,
      whatsapp: values.whatsapp,
      chosenClass: values.chosenClass,
      hasCompanions: values.hasCompanions === "sim",
      companionNames: values.hasCompanions === "sim" ? values.companionNames : "",
      year: targetYear,
      attended: false,
      createdAt,
    });

    // 2. Registro das Acompanhantes (se houver)
    if (values.hasCompanions === "sim" && values.companionNames) {
      const names = values.companionNames
        .split('\n')
        .map(n => n.trim())
        .filter(n => n.length > 0);

      names.forEach(companionName => {
        const compId = doc(collection(firestore, "womensMonth")).id;
        registrations.push({
          id: compId,
          name: companionName,
          whatsapp: values.whatsapp,
          chosenClass: values.chosenClass,
          hasCompanions: false,
          companionNames: "",
          year: targetYear,
          attended: false,
          createdAt,
          isCompanion: true, // Tag interna opcional
          invitedBy: values.name // Referência opcional
        });
      });
    }

    try {
      const promises = registrations.map(reg => 
        addDocumentNonBlocking(collection(firestore, 'womensMonth'), reg)
      );
      
      await Promise.all(promises);
      setIsSuccess(true);
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Erro ao Enviar",
        description: "Não foi possível processar as inscrições. Tente novamente.",
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
        <Card className="border-pink-200 bg-pink-50/30 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
            <CardContent className="p-10 text-center">
                <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-12 w-12 text-pink-600" />
                </div>
                <h2 className="text-3xl font-bold mb-4 text-pink-900">Inscrição Confirmada!</h2>
                <p className="text-pink-800 text-lg leading-relaxed max-w-md mx-auto">
                    Parabéns por dar esse passo rumo à sua segurança e confiança! 🛡️
                    <br/><br/>
                    As vagas para o **Mês das Mulheres** foram garantidas. Em breve entraremos em contato via WhatsApp para confirmar os detalhes da primeira aula.
                </p>
                <div className="mt-8 pt-6 border-t border-pink-200">
                    <p className="text-sm text-pink-700 font-medium">Nos vemos no tatame! Kida!</p>
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="shadow-2xl border-pink-100">
      <CardHeader className="bg-pink-600 text-white rounded-t-lg text-center pb-8">
        <div className="flex justify-center mb-4">
            <Star className="h-12 w-12 fill-white" />
        </div>
        <CardTitle className="text-2xl md:text-3xl font-bold">Mês das Mulheres</CardTitle>
        <CardDescription className="text-pink-100 text-base mt-2">
          Garanta seu mês de aula gratuita e descubra sua força.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-pink-900 font-bold">Seu Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Escreva seu nome" {...field} className="border-pink-200 focus-visible:ring-pink-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-pink-900 font-bold">WhatsApp</FormLabel>
                  <FormControl>
                    <Input placeholder="(11) 99999-9999" {...field} className="border-pink-200 focus-visible:ring-pink-500" />
                  </FormControl>
                  <FormDescription className="text-xs">Usaremos este número para agendar seu início.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="chosenClass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-pink-900 font-bold">Turma (Horário Escolhido)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-pink-200 focus:ring-pink-500">
                        <SelectValue placeholder="Selecione um horário" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Segundas e Quartas 18h">Segundas e Quartas 18h</SelectItem>
                      <SelectItem value="Terças e Quintas 19h">Terças e Quintas 19h</SelectItem>
                      <SelectItem value="Segundas e Quartas 20h">Segundas e Quartas 20h</SelectItem>
                      <SelectItem value="Sábados 10h30">Sábados 10h30</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasCompanions"
              render={({ field }) => (
                <FormItem className="space-y-3 p-4 rounded-lg bg-pink-50/50 border border-pink-100">
                  <FormLabel className="text-pink-900 font-bold flex items-center gap-2">
                    <Users className="h-4 w-4" /> Levará acompanhantes?
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="nao" className="text-pink-600 border-pink-300" />
                        </FormControl>
                        <FormLabel className="font-normal text-pink-800">Vou sozinha</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="sim" className="text-pink-600 border-pink-300" />
                        </FormControl>
                        <FormLabel className="font-normal text-pink-800">Sim, levarei amigas/familiares</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {hasCompanions === "sim" && (
              <FormField
                control={form.control}
                name="companionNames"
                render={({ field }) => (
                  <FormItem className="animate-in slide-in-from-top-2 duration-300">
                    <FormLabel className="text-pink-900 font-bold">Nomes das Acompanhantes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Escreva o nome de quem irá com você (um por linha)" 
                        className="border-pink-200 focus-visible:ring-pink-500 min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs">Elas também terão direito à promoção e serão cadastradas individualmente!</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button 
              type="submit" 
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold h-12 text-lg shadow-lg hover:shadow-pink-200 transition-all" 
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "QUERO MINHA VAGA GRÁTIS"}
            </Button>
            
            <p className="text-[10px] text-center text-pink-400 uppercase tracking-widest font-bold">
                CT Krav Magá Ipiranga - Segurança e Empoderamento
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
