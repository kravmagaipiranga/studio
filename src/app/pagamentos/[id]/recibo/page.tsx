
'use client';

import { useParams, useRouter } from "next/navigation";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { Payment, Student } from "@/lib/types";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { Printer, MessageSquare, Mail, ShieldCheck, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export default function ReciboPage() {
  const params = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const id = params.id as string;

  const paymentRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'payments', id);
  }, [firestore, id]);

  const { data: payment, isLoading: isLoadingPayment } = useDoc<Payment>(paymentRef);

  const studentRef = useMemoFirebase(() => {
    if (!firestore || !payment?.studentId) return null;
    return doc(firestore, 'students', payment.studentId);
  }, [firestore, payment?.studentId]);

  const { data: student, isLoading: isLoadingStudent } = useDoc<Student>(studentRef);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (isLoadingPayment || isLoadingStudent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-4">
        <Skeleton className="h-64 w-full max-w-md" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-xl font-bold">Pagamento não encontrado.</h1>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Voltar</Button>
      </div>
    );
  }

  const shareViaWhatsApp = () => {
    if (!student || !student.phone) {
      toast({ variant: "destructive", title: "Erro", description: "WhatsApp do aluno não cadastrado." });
      return;
    }

    const cleanPhone = student.phone.replace(/\D/g, '');
    const date = format(parseISO(payment.paymentDate), 'dd/MM/yyyy');
    const message = `*RECIBO DE PAGAMENTO - CT KRAV MAGÁ IPIRANGA*\n\n` +
                    `Recebemos de: *${payment.studentName}*\n` +
                    `Valor: *R$ ${payment.amount.toFixed(2)}*\n` +
                    `Referente a: *${payment.planType}*\n` +
                    `Data do Pagamento: *${date}*\n` +
                    `Forma de Pagamento: *${payment.paymentMethod}*\n\n` +
                    `Agradecemos a preferência! Kida! 👊\n` +
                    `Rua Tabor, 482 - Ipiranga\n` +
                    `Tel: 11 2589-6049`;

    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareViaEmail = () => {
    if (!student || !student.email) {
      toast({ variant: "destructive", title: "Erro", description: "E-mail do aluno não cadastrado." });
      return;
    }

    const date = format(parseISO(payment.paymentDate), 'dd/MM/yyyy');
    const subject = `Recibo de Pagamento - CT KRAV MAGÁ IPIRANGA`;
    const body = `Olá, ${payment.studentName}!\n\nConfirmamos o recebimento do seu pagamento no valor de R$ ${payment.amount.toFixed(2)} referente ao plano ${payment.planType} em ${date}.\n\nObrigado por treinar conosco!\n\nCT KRAV MAGÁ IPIRANGA\nRua Tabor, 482 - Ipiranga\nTel: 11 2589-6049\nKida!`;

    window.location.href = `mailto:${student.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="min-h-screen bg-muted/20 p-4 sm:p-8 print:p-0 print:bg-white">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <Button variant="ghost" onClick={() => window.close()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Fechar Aba
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={shareViaWhatsApp}>
              <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp
            </Button>
            <Button variant="outline" onClick={shareViaEmail}>
              <Mail className="mr-2 h-4 w-4" /> E-mail
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
          </div>
        </div>

        <div className="bg-white border rounded-xl shadow-sm p-8 space-y-8 print:border-none print:shadow-none">
          <div className="text-center border-b pb-6 space-y-2">
            <div className="flex justify-center mb-2">
              <ShieldCheck className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-primary">CT KRAV MAGÁ IPIRANGA</h1>
            <div className="text-sm text-muted-foreground">
              <p>Rua Tabor, 482 - Ipiranga - São Paulo - SP</p>
              <p>Contato: 11 2589-6049 | CNPJ: 31.116.136/0001-95</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg">
              <span className="text-sm font-bold uppercase text-muted-foreground">Valor Recebido</span>
              <span className="text-3xl font-black text-primary">R$ {payment.amount.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">Aluno</p>
                <p className="text-base font-bold">{payment.studentName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">Referente a</p>
                <p className="text-base font-bold">{payment.planType}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">Data do Pagamento</p>
                <p className="text-base font-bold">{format(parseISO(payment.paymentDate), 'dd/MM/yyyy')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">Forma de Pagamento</p>
                <p className="text-base font-bold">{payment.paymentMethod}</p>
              </div>
              {payment.expirationDate && (
                <div className="space-y-1 sm:col-span-2 border-t pt-4 mt-2">
                  <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">Vencimento do Plano</p>
                  <p className="text-base font-bold">{format(parseISO(payment.expirationDate), 'dd/MM/yyyy')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="text-center pt-12">
            <div className="h-px w-48 bg-muted mx-auto mb-2"></div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Assinatura Digital - CT KM Ipiranga</p>
            <p className="text-[9px] text-muted-foreground italic mt-8">
              Este documento é um recibo eletrônico gerado pelo sistema de gestão em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
