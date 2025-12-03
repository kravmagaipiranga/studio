'use client';

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Student } from "@/lib/types";
import { ArrowLeft, Edit, FileText, Gift, Hash, Phone, Shirt, Trash2, User, DollarSign, Calendar, CreditCard, Star } from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useDoc, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentFormDialog } from "@/components/students/student-form-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const studentRef = useMemoFirebase(() => {
    if (!firestore || !params.id) return null;
    return doc(firestore, 'students', params.id);
  }, [firestore, params.id]);

  const { data: student, isLoading } = useDoc<Student>(studentRef);

  const handleDeleteStudent = () => {
    if (!studentRef) return;
    deleteDocumentNonBlocking(studentRef);
    toast({
      title: "Aluno Excluído",
      description: "O aluno foi removido do sistema.",
    });
    router.push("/alunos");
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-10 w-44" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <div className="grid gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-80" />
                    </div>
                </CardHeader>
            </Card>
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-4 w-72" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-40" />
                        <Skeleton className="h-4 w-60" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
      </>
    );
  }

  if (!student) {
    notFound();
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <Link href="/alunos">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Alunos
          </Button>
        </Link>
        <div className="flex items-center gap-2">
           <Button onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Aluno
           </Button>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
            </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border">
                <AvatarImage src={student.avatar} alt={student.name} data-ai-hint="person face" />
                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-3xl">{student.name}</CardTitle>
                <CardDescription>{student.email}</CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
                <Badge variant={student.status === 'Ativo' ? 'default' : 'secondary'} className="text-sm">
                    {student.status}
                </Badge>
                 <Badge variant={student.paymentStatus === 'Pago' ? 'outline' : 'destructive'} className="text-sm">
                    Pagamento {student.paymentStatus}
                </Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Dados preenchidos no cadastro.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <InfoItem icon={<User />} label="Nome Completo" value={student.name} />
               <Separator />
               <InfoItem icon={<Gift />} label="Data de Nascimento" value={student.dob ? new Date(student.dob + 'T00:00:00').toLocaleDateString('pt-BR') : ''} />
               <Separator />
               <InfoItem icon={<Hash />} label="CPF" value={student.cpf} />
               <Separator />
               <InfoItem icon={<Phone />} label="Telefone / WhatsApp" value={student.phone} />
               <Separator />
               <InfoList icon={<User />} label="Contatos de Emergência" value={student.emergencyContacts} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Controle Interno</CardTitle>
              <CardDescription>Dados de gestão da academia.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoItem icon={<Star />} label="Graduação (Faixa)" value={student.belt} />
              <Separator />
              <InfoItem icon={<Calendar />} label="Data de Início" value={student.registrationDate ? new Date(student.registrationDate).toLocaleDateString('pt-BR') : 'Não definido'} />
              <Separator />
              <InfoItem icon={<Calendar />} label="Último Exame" value={student.lastExamDate ? new Date(student.lastExamDate).toLocaleDateString('pt-BR') : 'Não definido'} />
              <Separator />
              <InfoItem label="Anuidade FIKM" value={student.fikmAnnuityPaid ? "Paga" : "Pendente"} />
            </CardContent>
          </Card>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
           <Card>
                <CardHeader>
                    <CardTitle>Informações Financeiras</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <InfoItem icon={<FileText />} label="Plano" value={student.planType || 'Não definido'} />
                    <Separator />
                    <InfoItem icon={<DollarSign />} label="Valor do Plano" value={student.planValue ? `R$ ${student.planValue.toFixed(2)}` : 'Não definido'} />
                    <Separator />
                    <InfoItem icon={<Calendar />} label="Último Pagamento" value={student.lastPaymentDate ? new Date(student.lastPaymentDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Nenhum'} />
                    <Separator />
                    <InfoItem icon={<Calendar />} label="Vencimento" value={student.planExpirationDate ? new Date(student.planExpirationDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Uniformes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <InfoItem icon={<Shirt />} label="Tamanho da Camiseta" value={student.tshirtSize} />
                    <Separator />
                    <InfoItem icon={<FileText />} label="Tamanho da Calça" value={student.pantsSize} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Créditos</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-sm text-muted-foreground">{student.paymentCredits || "Nenhum crédito ou observação."}</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Histórico Médico</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-sm text-muted-foreground">{student.medicalHistory || "Nenhuma informação médica registrada."}</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Anotações Gerais</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{student.generalNotes || "Nenhuma anotação."}</p>
                </CardContent>
            </Card>
        </div>
      </div>

       <StudentFormDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        student={student}
      />

       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá excluir permanentemente o
              aluno do banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStudent} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function InfoItem({ icon, label, value }: { icon?: React.ReactNode, label: string; value: string | number | React.ReactNode; }) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-sm text-muted-foreground text-right">{value}</span>
    </div>
  );
}

function InfoList({ icon, label, value }: { icon?: React.ReactNode, label: string; value: string | React.ReactNode; }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
         {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-sm text-muted-foreground ml-9">{value}</p>
    </div>
  );
}
