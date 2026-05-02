'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { doc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getStorage } from 'firebase/storage';
import { getApp } from 'firebase/app';
import { useFirestore } from "@/firebase";
import { Student } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRef, useState } from "react";
import { Camera, Loader2, Pencil, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(student.photoUrl ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !firestore) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Arquivo muito grande", description: "A foto deve ter no máximo 5 MB." });
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast({ variant: "destructive", title: "Formato inválido", description: "Selecione uma imagem (JPG, PNG, etc.)." });
      return;
    }

    setPhotoPreview(URL.createObjectURL(file));
    setIsUploadingPhoto(true);

    try {
      const storage = getStorage(getApp());
      const photoRef = storageRef(storage, `students/${student.id}/profile`);
      await uploadBytes(photoRef, file, { contentType: file.type });
      const url = await getDownloadURL(photoRef);

      const studentDoc = doc(firestore, 'students', student.id);
      await updateDoc(studentDoc, { photoUrl: url });

      setPhotoPreview(url);
      toast({ title: "Foto atualizada!", description: "Sua foto de perfil foi salva com sucesso." });
    } catch (err) {
      console.error('[photo-upload]', err);
      setPhotoPreview(student.photoUrl ?? null);
      toast({ variant: "destructive", title: "Erro ao enviar foto", description: "Não foi possível salvar a imagem. Tente novamente." });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

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
      <CardContent className="space-y-6">

        {/* ── Foto de perfil ─────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className={cn(
                "w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20",
                "flex items-center justify-center bg-muted",
                "hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isUploadingPhoto && "opacity-60 cursor-not-allowed"
              )}
              aria-label="Alterar foto de perfil"
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                  onError={() => setPhotoPreview(null)}
                />
              ) : (
                <UserRound className="w-12 h-12 text-muted-foreground/50" strokeWidth={1.5} />
              )}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className={cn(
                "absolute bottom-0 right-0 w-8 h-8 rounded-full",
                "bg-primary text-primary-foreground shadow-md border-2 border-background",
                "flex items-center justify-center",
                "hover:bg-primary/90 transition-colors focus:outline-none",
                isUploadingPhoto && "opacity-60 cursor-not-allowed"
              )}
              aria-label="Alterar foto"
            >
              {isUploadingPhoto
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Camera className="w-4 h-4" />
              }
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {isUploadingPhoto ? "Enviando foto…" : "Toque para alterar a foto"}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>

        {/* ── Formulário de dados ────────────────────────────────────────── */}
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
