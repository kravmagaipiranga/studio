
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { collection, doc } from 'firebase/firestore';
import { useState } from "react";
import { CheckCircle, Loader2, Users, Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, useFirestore } from "@/firebase";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const registrationSchema = z.object({
  name: z.string().min(3, "Digite seu nome completo."),
  whatsapp: z.string().min(10, "Informe um WhatsApp válido."),
  chosenClass: z.string().min(1, "Escolha um horário."),
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
    const targetYear = currentYear;
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

    // 2. Registro das Acompanhantes
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
          isCompanion: true,
          invitedBy: values.name
        });
      });
    }

    try {
      const promises = registrations.map(reg => {
        const docRef = doc(firestore, 'womensMonth', reg.id);
        return addDocumentNonBlocking(collection(firestore, 'womensMonth'), reg);
      });
      
      await Promise.all(promises);
      setIsSuccess(true);
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Erro ao Enviar",
        description: "Não foi possível processar as inscrições.",
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
        <div className="text-center py-10 space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-12 w-12 text-pink-600" />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-pink-900">Inscrição Confirmada!</h2>
                <p className="text-pink-700 leading-relaxed">
                    Sua vaga e de suas acompanhantes estão garantidas. Entraremos em contato via WhatsApp em breve!
                </p>
            </div>
            <Button 
                variant="outline" 
                className="border-pink-200 text-pink-600 hover:bg-pink-50"
                onClick={() => window.location.reload()}
            >
                Fazer nova inscrição
            </Button>
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-pink-900 font-semibold">Seu Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Como você quer ser chamada?" {...field} className="border-pink-100" />
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
              <FormLabel className="text-pink-900 font-semibold">WhatsApp</FormLabel>
              <FormControl>
                <Input placeholder="(11) 99999-9999" {...field} className="border-pink-100" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="chosenClass"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-pink-900 font-semibold">Turma Desejada</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="border-pink-100">
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

        <div className="pt-2">
            <FormField
            control={form.control}
            name="hasCompanions"
            render={({ field }) => (
                <FormItem className="space-y-3 p-4 rounded-xl bg-pink-50/50 border border-pink-100">
                <FormLabel className="text-pink-900 font-bold flex items-center gap-2">
                    <Users className="h-4 w-4" /> Vai trazer acompanhantes?
                </FormLabel>
                <FormControl>
                    <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex gap-4"
                    >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                        <RadioGroupItem value="nao" className="text-pink-600 border-pink-300" />
                        </FormControl>
                        <FormLabel className="font-normal text-pink-800">Sozinha</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                        <RadioGroupItem value="sim" className="text-pink-600 border-pink-300" />
                        </FormControl>
                        <FormLabel className="font-normal text-pink-800">Com acompanhantes</FormLabel>
                    </FormItem>
                    </RadioGroup>
                </FormControl>
                </FormItem>
            )}
            />
        </div>

        {hasCompanions === "sim" && (
          <FormField
            control={form.control}
            name="companionNames"
            render={({ field }) => (
              <FormItem className="animate-in slide-in-from-top-2 duration-300">
                <FormLabel className="text-pink-900 font-semibold flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-500" /> Nomes das Amigas
                </FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Um nome por linha..." 
                    className="border-pink-100 min-h-[80px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription className="text-[10px]">
                    Elas também ganham o mês gratuito e terão inscrições próprias!
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button 
          type="submit" 
          className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold h-12 shadow-lg transition-all" 
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "QUERO MINHA VAGA GRÁTIS"}
        </Button>
      </form>
    </Form>
  );
}
