
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { collection, doc } from 'firebase/firestore'
import { useEffect } from "react"

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
import { Switch } from "../ui/switch"
import { ScrollArea } from "../ui/scroll-area"

const formSchema = z.object({
  name: z.string().min(2, "O nome completo deve ter pelo menos 2 caracteres."),
  dob: z.string().refine((val) => val, {
    message: "A data de nascimento é obrigatória.",
  }),
  cpf: z.string().min(11, "O CPF deve ter 11 dígitos.").max(14, "Formato de CPF inválido."),
  phone: z.string().min(10, "O número de telefone/WhatsApp é obrigatório."),
  email: z.string().email("Por favor, insira um endereço de e-mail válido."),
  
  startDate: z.string().optional(),
  belt: z.string().min(1, "A faixa é obrigatória"),
  status: z.string().min(1, "O status do aluno é obrigatório"),
  
  tshirtSize: z.string().min(1, "Selecione um tamanho de camiseta."),
  pantsSize: z.string().min(1, "Selecione um tamanho de calça."),

  planType: z.enum(["Mensal", "Trimestral", "Bolsa"]).optional(),
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
  
  fikmAnnuityPaid: z.boolean().optional(),
  fikmAnnuityPaymentDate: z.string().optional(),
  fikmAnnuityPaymentMethod: z.enum(["Pix", "Cartão", "Dinheiro", "Pendente"]).optional(),

  emergencyContacts: z.string().optional(),
  medicalHistory: z.string().optional(),
  generalNotes: z.string().optional(),
});

interface StudentFormProps {
  student?: Student | null;
  onFormSubmit: () => void;
  isEditing: boolean;
}

export function StudentForm({ student, onFormSubmit, isEditing }: StudentFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      dob: "",
      cpf: "",
      phone: "",
      email: "",
      tshirtSize: "M",
      pantsSize: "M",
      emergencyContacts: "",
      belt: 'Branca',
      status: 'Ativo',
      startDate: "",
      generalNotes: "",
      medicalHistory: "",
      planType: 'Mensal',
      planValue: 200,
      fikmAnnuityPaid: false,
      fikmAnnuityPaymentDate: "",
      fikmAnnuityPaymentMethod: 'Pendente',
    }
  });

  useEffect(() => {
    if (student) {
      form.reset({
        name: student.name || "",
        dob: student.dob ? student.dob.split('T')[0] : '',
        cpf: student.cpf || "",
        phone: student.phone || "",
        email: student.email || "",
        tshirtSize: student.tshirtSize || "M",
        pantsSize: student.pantsSize || "M",
        emergencyContacts: student.emergencyContacts || "",
        belt: student.belt || 'Branca',
        status: student.status || 'Ativo',
        startDate: student.startDate ? student.startDate.split('T')[0] : '',
        generalNotes: student.generalNotes || "",
        medicalHistory: student.medicalHistory || "",
        planType: student.planType || 'Mensal',
        planValue: student.planValue ?? 200,
        fikmAnnuityPaid: student.fikmAnnuityPaid || false,
        fikmAnnuityPaymentDate: student.fikmAnnuityPaymentDate ? student.fikmAnnuityPaymentDate.split('T')[0] : '',
        fikmAnnuityPaymentMethod: student.fikmAnnuityPaymentMethod || 'Pendente',
      });
    } else {
        form.reset({
          name: "", dob: "", cpf: "", phone: "", email: "",
          tshirtSize: "M", pantsSize: "M", emergencyContacts: "",
          belt: 'Branca', status: 'Ativo', startDate: "",
          generalNotes: "", medicalHistory: "", planType: 'Mensal',
          planValue: 200, fikmAnnuityPaid: false,
          fikmAnnuityPaymentDate: "", fikmAnnuityPaymentMethod: 'Pendente'
        });
    }
  }, [student, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "Erro de Conexão",
        description: "Não foi possível conectar ao banco de dados. Tente novamente.",
      });
      return;
    }
    
    const studentId = isEditing && student ? student.id : doc(collection(firestore, "students")).id;
    
    const studentData: Partial<Student> = {
        ...values,
        id: studentId,
        registrationDate: student?.registrationDate || new Date().toISOString(),
        planValue: values.planValue, 
    };

    if (isEditing && student) {
      studentData.lastPaymentDate = student.lastPaymentDate;
      studentData.planExpirationDate = student.planExpirationDate;
      studentData.paymentStatus = student.paymentStatus;
      studentData.paymentCredits = student.paymentCredits;
    } else {
      studentData.paymentStatus = 'Pendente';
    }

    const docRef = doc(firestore, 'students', studentId);
    setDocumentNonBlocking(docRef, studentData, { merge: true });

    toast({
      title: isEditing ? "Aluno Atualizado!" : "Cadastro Realizado!",
      description: isEditing ? `Os dados de ${values.name} foram atualizados.` : `${values.name} foi adicionado com sucesso.`,
    })
    
    onFormSubmit();
  }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 h-full flex flex-col">
            <ScrollArea className="flex-grow pr-4 -mr-4">
            <div className="space-y-6">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="dob"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl>
                            <Input type="date" {...field} value={field.value ?? ''} />
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
                
                <h3 className="text-lg font-medium border-b pb-2 pt-4">Controle Interno</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="belt"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Faixa</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
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
                                <SelectItem value="Bolsa">Bolsa</SelectItem>
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
                                placeholder="200.00" 
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

                <h3 className="text-lg font-medium border-b pb-2 pt-4">Anuidade FIKM</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    <FormField
                        control={form.control}
                        name="fikmAnnuityPaid"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm sm:col-span-1 h-[58px] mt-2">
                                <FormLabel className="mr-4">Paga?</FormLabel>
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
                                    <SelectItem value="Cartão">Cartão</SelectItem>
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
                            <Select onValueChange={field.onChange} value={field.value}>
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
                            <Select onValueChange={field.onChange} value={field.value}>
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
            <div className="flex-shrink-0 flex justify-end pt-6 gap-2">
                <Button type="button" variant="outline" onClick={onFormSubmit}>Cancelar</Button>
                <Button type="submit">{isEditing ? "Salvar Alterações" : "Adicionar Aluno"}</Button>
            </div>
        </form>
    </Form>
  )
}
