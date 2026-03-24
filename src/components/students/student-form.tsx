
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { collection, doc } from 'firebase/firestore'
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { differenceInYears, parseISO } from "date-fns"


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
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from "@/firebase"
import { Student } from "@/lib/types"
import { Switch } from "../ui/switch"
import { ScrollArea } from "../ui/scroll-area"
import { Skeleton } from "../ui/skeleton"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { Lightbulb } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"

const formSchema = z.object({
  name: z.string().min(2, "O nome completo deve ter pelo menos 2 caracteres."),
  dob: z.string().refine((val) => val, {
    message: "A data de nascimento é obrigatória.",
  }),
  cpf: z.string().min(11, "O CPF deve ter 11 dígitos.").max(14, "Formato de CPF inválido."),
  phone: z.string().min(10, "O número de telefone/WhatsApp é obrigatório."),
  email: z.string().email("Por favor, insira um endereço de e-mail válido."),
  
  userId: z.string().optional(),
  startDate: z.string().optional(),
  lastExamDate: z.string().optional(),
  readyForReview: z.boolean().optional(),
  belt: z.string().min(1, "A faixa é obrigatória"),
  status: z.enum(["Ativo", "Inativo", "Pendente"]),
  
  tshirtSize: z.string().min(1, "Selecione um tamanho de camiseta."),
  pantsSize: z.string().min(1, "Selecione um tamanho de calça."),

  planType: z.enum(["Mensal", "Trimestral", "Bolsa 50%", "Bolsa 100%", "Outros", "Matrícula"]).optional(),
  planValue: z.preprocess(
    (a) => {
      if (typeof a === 'string' && a.trim() !== '') {
        const num = parseFloat(a.replace(',', '.'));
        return isNaN(num) ? undefined : num;
      }
      if (typeof a === 'number') return a;
      return undefined;
    },
    z.number({ invalid_type_error: "O valor deve ser um número." }).optional()
  ),
  paymentPreference: z.array(z.enum(["pix", "dinheiro", "boleto"])).optional(),
  
  fikmAnnuityPaid: z.boolean().optional(),
  fikmAnnuityPaymentDate: z.string().optional(),
  fikmAnnuityPaymentMethod: z.enum(["Pix", "Boleto", "Dinheiro", "Pendente"]).optional(),

  emergencyContacts: z.string().optional(),
  medicalHistory: z.string().optional(),
  generalNotes: z.string().optional(),
});

interface StudentFormProps {
  studentId?: string;
  isEditing: boolean;
}

function StudentFormSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
            <Skeleton className="h-10 w-32 ml-auto" />
        </div>
    );
}

export function StudentForm({ studentId, isEditing }: StudentFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const router = useRouter();
  const [pasteData, setPasteData] = useState("");
  const [age, setAge] = useState<number | null>(null);

  const studentRef = useMemoFirebase(() => {
    if (!firestore || !studentId) return null;
    return doc(firestore, 'students', studentId);
  }, [firestore, studentId]);

  const { data: student, isLoading } = useDoc<Student>(studentRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      dob: "",
      cpf: "",
      phone: "",
      email: "",
      userId: "",
      tshirtSize: "M",
      pantsSize: "M",
      emergencyContacts: "",
      belt: 'Branca' as const,
      status: 'Ativo' as const,
      startDate: "",
      lastExamDate: "",
      readyForReview: false,
      generalNotes: "",
      medicalHistory: "",
      planType: 'Mensal' as const,
      planValue: 330,
      paymentPreference: [],
      fikmAnnuityPaid: false,
      fikmAnnuityPaymentDate: "",
      fikmAnnuityPaymentMethod: 'Pendente' as const,
    },
  });

  const dobValue = form.watch("dob");

  useEffect(() => {
    if (dobValue) {
      try {
        const birthDate = parseISO(dobValue);
        const calculatedAge = differenceInYears(new Date(), birthDate);
        setAge(calculatedAge);
      } catch (error) {
        setAge(null);
      }
    } else {
      setAge(null);
    }
  }, [dobValue]);

  useEffect(() => {
    if (isEditing && student) {
      form.reset({
        name: student.name || "",
        dob: student.dob ? student.dob.split('T')[0] : '',
        cpf: student.cpf || "",
        phone: student.phone || "",
        email: student.email || "",
        userId: student.userId || "",
        tshirtSize: student.tshirtSize || "M",
        pantsSize: student.pantsSize || "M",
        emergencyContacts: student.emergencyContacts || "",
        belt: student.belt || 'Branca',
        status: student.status || 'Ativo',
        startDate: student.startDate ? student.startDate.split('T')[0] : '',
        lastExamDate: student.lastExamDate ? student.lastExamDate.split('T')[0] : '',
        readyForReview: student.readyForReview || false,
        generalNotes: student.generalNotes || "",
        medicalHistory: student.medicalHistory || "",
        planType: student.planType || 'Mensal',
        planValue: student.planValue ?? 330,
        paymentPreference: student.paymentPreference || [],
        fikmAnnuityPaid: student.fikmAnnuityPaid || false,
        fikmAnnuityPaymentDate: student.fikmAnnuityPaymentDate ? student.fikmAnnuityPaymentDate.split('T')[0] : '',
        fikmAnnuityPaymentMethod: student.fikmAnnuityPaymentMethod || 'Pendente',
      });
    }
  }, [student, isEditing, form]);

  const handlePasteAndFill = () => {
    if (!pasteData) {
        toast({
            variant: "destructive",
            title: "Nenhum dado para analisar",
            description: "Por favor, cole os dados do aluno no campo de texto.",
        });
        return;
    }

    const values = pasteData.split('\t'); 

    const [name, dob, cpf, phone, email, belt, status, startDate] = values;

    if (name) form.setValue("name", name.trim());
    if (dob) form.setValue("dob", dob.trim());
    if (cpf) form.setValue("cpf", cpf.trim());
    if (phone) form.setValue("phone", phone.trim());
    if (email) form.setValue("email", email.trim());
    if (belt) form.setValue("belt", belt.trim());
    if (status) form.setValue("status", status.trim() as 'Ativo' | 'Inativo' | 'Pendente');
    if (startDate) form.setValue("startDate", startDate.trim());


    toast({
        title: "Formulário Preenchido",
        description: "Os dados foram preenchidos. Por favor, revise antes de salvar.",
    });
    setPasteData("");
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "Erro de Conexão",
        description: "Não foi possível conectar ao banco de dados. Tente novamente.",
      });
      return;
    }
    
    const finalStudentId = isEditing && student ? student.id : doc(collection(firestore, "students")).id;
    
    const studentData: Partial<Student> = {
        ...values,
        id: finalStudentId,
        registrationDate: student?.registrationDate || new Date().toISOString(),
        planValue: values.planValue,
        paymentStatus: student?.paymentStatus || 'Pendente',
        ...(student?.lastPaymentDate && { lastPaymentDate: student.lastPaymentDate }),
        ...(student?.planExpirationDate && { planExpirationDate: student.planExpirationDate }),
        ...(student?.paymentCredits && { paymentCredits: student.paymentCredits }),
    };

    const docRef = doc(firestore, 'students', finalStudentId);
    setDocumentNonBlocking(docRef, studentData, { merge: true });

    toast({
      title: isEditing ? "Aluno Atualizado!" : "Cadastro Realizado!",
      description: isEditing ? `Os dados de ${values.name} foram atualizados.` : `${values.name} foi adicionado com sucesso.`,
    })
    
    router.push('/alunos');
  }

  if (isEditing && isLoading) {
      return <StudentFormSkeleton />;
  }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 h-full flex flex-col">
            <ScrollArea className="flex-grow pr-4 -mr-4">
                <div className="space-y-6">

                    {!isEditing && (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                          <AccordionTrigger>
                            <div className="flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-yellow-500" />
                                Importação Rápida
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Copie uma linha de uma planilha e cole no campo abaixo.
                                    A ordem das colunas deve ser: <br/>
                                    <code className="font-mono text-xs">Nome | Data de Nasc. (AAAA-MM-DD) | CPF | Telefone | Email | Faixa | Status | Início (AAAA-MM-DD)</code>
                                </p>
                                <Textarea 
                                    placeholder="Cole os dados aqui..."
                                    value={pasteData}
                                    onChange={(e) => setPasteData(e.target.value)}
                                />
                                <Button type="button" onClick={handlePasteAndFill}>Analisar e Preencher</Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}

                    <h3 className="text-lg font-medium border-b pb-2">Informações Pessoais</h3>
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField
                        control={form.control}
                        name="dob"
                        render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                            <FormLabel>Data de Nascimento</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormItem>
                            <FormLabel>Idade</FormLabel>
                            <FormControl>
                                <Input 
                                    type="text" 
                                    value={age !== null ? `${age} anos` : "..."} 
                                    disabled 
                                    className="disabled:opacity-100 disabled:cursor-default" 
                                />
                            </FormControl>
                        </FormItem>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    </div>
                    
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
                    
                    <h3 className="text-lg font-medium border-b pb-2 pt-4">Controle Interno</h3>
                     <FormField
                        control={form.control}
                        name="userId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>User ID (para login do aluno)</FormLabel>
                            <FormControl>
                                <Input placeholder="Cole o UID do Firebase Auth aqui" {...field} value={field.value ?? ''} />
                            </FormControl>
                             <FormMessage />
                        </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="belt"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Faixa</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Branca, Amarela, etc." {...field} />
                                </FormControl>
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
                                <Select onValueChange={field.onChange} value={field.value}>
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
                        <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Início dos Treinos</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                        <FormField
                            control={form.control}
                            name="lastExamDate"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Último Exame de Faixa</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="readyForReview"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm h-10">
                                    <FormLabel className="mr-4 mb-0">Apto para Revisão?</FormLabel>
                                    <FormControl>
                                        <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>

                    <h3 className="text-lg font-medium border-b pb-2 pt-4">Financeiro (Plano)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="planType"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Plano</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Selecione o plano" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Mensal">Mensal</SelectItem>
                                    <SelectItem value="Trimestral">Trimestral</SelectItem>
                                    <SelectItem value="Bolsa 50%">Bolsa 50%</SelectItem>
                                    <SelectItem value="Bolsa 100%">Bolsa 100%</SelectItem>
                                    <SelectItem value="Outros">Outros</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="planValue"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valor do Plano (R$)</FormLabel>
                                <FormControl>
                                <Input 
                                    type="number" 
                                    step="0.01" 
                                    placeholder="330.00" 
                                    {...field} 
                                    value={field.value ?? ''}
                                    onChange={event => field.onChange(event.target.value === '' ? undefined : parseFloat(event.target.value))} 
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="paymentPreference"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Preferência de Pagamento</FormLabel>
                                <FormControl>
                                    <ToggleGroup 
                                        type="multiple" 
                                        variant="outline" 
                                        className="justify-start"
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <ToggleGroupItem value="pix">Pix</ToggleGroupItem>
                                        <ToggleGroupItem value="dinheiro">Dinheiro</ToggleGroupItem>
                                        <ToggleGroupItem value="boleto">Boleto</ToggleGroupItem>
                                    </ToggleGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />


                    <h3 className="text-lg font-medium border-b pb-2 pt-4">Anuidade FIKM</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        <FormField
                            control={form.control}
                            name="fikmAnnuityPaid"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm h-10">
                                    <FormLabel className="mr-4 mb-0">Anuidade Paga?</FormLabel>
                                    <FormControl>
                                        <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="fikmAnnuityPaymentDate"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Data Pgto. Anuidade</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} value={field.value ?? ''} disabled={!form.watch('fikmAnnuityPaid')} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="fikmAnnuityPaymentMethod"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Forma Pgto. Anuidade</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={!form.watch('fikmAnnuityPaid')}>
                                    <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Pendente">Pendente</SelectItem>
                                        <SelectItem value="Pix">Pix</SelectItem>
                                        <SelectItem value="Boleto">Boleto</SelectItem>
                                        <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    
                    <h3 className="text-lg font-medium border-b pb-2 pt-4">Uniforme</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    <h3 className="text-lg font-medium border-b pb-2 pt-4">Informações Adicionais (Opcional)</h3>
                    <FormField
                        control={form.control}
                        name="emergencyContacts"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contatos de Emergência</FormLabel>
                            <FormControl>
                            <Textarea placeholder="Nome, parentesco e telefone de um ou mais contatos" {...field} value={field.value ?? ''}/>
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
                            <FormLabel>Histórico Médico</FormLabel>
                            <FormControl>
                            <Textarea placeholder="Alergias, condições pré-existentes, etc." {...field} value={field.value ?? ''} />
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
                            <FormLabel>Anotações Gerais</FormLabel>
                            <FormControl>
                            <Textarea placeholder="Qualquer outra observação relevante." {...field} value={field.value ?? ''}/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </ScrollArea>
            <div className="flex-shrink-0 flex justify-end pt-6 gap-2 border-t mt-auto">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                <Button type="submit">{isEditing ? "Salvar Alterações" : "Adicionar Aluno"}</Button>
            </div>
        </form>
    </Form>
  )
}
