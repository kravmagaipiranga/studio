import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { students } from "@/lib/data";
import { Student } from "@/lib/types";
import { ArrowLeft, Edit, FileText, Gift, Hash, HeartPulse, MoreVertical, Phone, Shirt, Trash2, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  const student = students.find((s) => s.id === params.id);

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
           <Button>
            <Edit className="mr-2 h-4 w-4" />
            Editar Aluno
           </Button>
            <Button variant="destructive">
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
              <CardDescription>Dados preenchidos pelo aluno no cadastro.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <InfoItem icon={<User />} label="Nome Completo" value={student.name} />
               <Separator />
               <InfoItem icon={<Gift />} label="Data de Nascimento" value={new Date(student.dob).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} />
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
              <InfoItem label="Graduação (Faixa)" value={student.belt} />
              <Separator />
              <InfoItem label="Data de Início" value={student.startDate ? new Date(student.startDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Não definido'} />
              <Separator />
              <InfoItem label="Último Exame" value={student.lastExamDate ? new Date(student.lastExamDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Não definido'} />
              <Separator />
              <InfoItem label="Anuidade FIKM" value={student.fikmAnnuityPaid ? "Paga" : "Pendente"} />
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </>
  );
}

function InfoItem({ icon, label, value }: { icon?: React.ReactNode, label: string; value: string | React.ReactNode; }) {
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
