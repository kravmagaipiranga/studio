
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore } from "@/firebase";
import { Student } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Loader2, Pencil } from "lucide-react";

interface StudentPortalFormProps {
    student: Student;
}

const formSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  dob: z.string().optional(),
  cpf: z.string().optional(),
  phone: z.string().min(10, "O telefone é obrigatório."),
  email: z.string().email("O e-mail deve ser válido."),
  tshirtSize: z.string().optional(),
  pantsSize: z.string().optional(),
  emergencyContacts: z.string().optional(),
  medicalHistory: z.string().optional(),
});

export function StudentPortalForm({ student }: StudentPortalFormProps) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: student.name || "",
            dob: student.dob ? student.dob.split('T')[0] : "",
            cpf: student.cpf || "",
            phone: student.phone || "",
            email: student.email || "",
            tshirtSize: student.tshirtSize || "",
            pantsSize: student.pantsSize || "",
            emergencyContacts: student.emergencyContacts || "",
            medicalHistory: student.medicalHistory || "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!firestore) {
            toast({ variant: "destructive", title: "Erro de conexão." });
            return;
        }
        setIsSaving(true);
        const studentRef = doc(firestore, 'students', student.id);

        try {
            await updateDoc(studentRef, values);
            toast({ title: "Perfil Atualizado!", description: "Suas informações foram salvas com sucesso." });
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao salvar", description: "Não foi possível atualizar seu perfil. Tente novamente." });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Meu Perfil</CardTitle>
                <CardDescription>Edite suas informações de contato e dados pessoais.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="dob" render={({ field }) => (
                                <FormItem><FormLabel>Data de Nascimento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="cpf" render={({ field }) => (
                                <FormItem><FormLabel>CPF</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="tshirtSize" render={({ field }) => (
                                <FormItem><FormLabel>Tam. Camiseta</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="pantsSize" render={({ field }) => (
                                <FormItem><FormLabel>Tam. Calça</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="emergencyContacts" render={({ field }) => (
                            <FormItem><FormLabel>Contatos de Emergência</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="medicalHistory" render={({ field }) => (
                            <FormItem><FormLabel>Histórico Médico</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="flex justify-end pt-2">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />}
                                Salvar Alterações
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

