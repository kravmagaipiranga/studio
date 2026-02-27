'use client';

import { useParams, useRouter } from "next/navigation";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { Payment, Student } from "@/lib/types";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { Printer, MessageSquare, Mail, ShieldCheck, ArrowLeft, Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useRef } from "react";
import { toPng } from 'html-to-image';

export default function ReciboPage() {
  const params = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const id = params.id as string;
  const receiptRef = useRef<HTMLDivElement>(null);

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
  const [isExporting, setIsExporting] = useState(false);

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
    const expiryDate = payment.expirationDate ? format(parseISO(payment.expirationDate), 'dd/MM/yyyy') : 'Não informada';
    
    const message = `*RECIBO DE PAGAMENTO - CT KRAV MAGÁ IPIRANGA*\n\n` +
                    `Recebemos de: *${payment.studentName}*\n` +
                    `Valor: *R$ ${payment.amount.toFixed(2)}*\n` +
                    `Referente a: *${payment.planType}*\n` +
                    `Data do Pagamento: *${date}*\n` +
                    `Validade do Plano: *${expiryDate}*\n` +
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
    const expiryDate = payment.expirationDate ? format(parseISO(payment.expirationDate), 'dd/MM/yyyy') : 'N/A';
    const subject = `Recibo de Pagamento - CT KRAV MAGÁ IPIRANGA`;
    const body = `Olá, ${payment.studentName}!\n\nConfirmamos o recebimento do seu pagamento no valor de R$ ${payment.amount.toFixed(2)} referente ao plano ${payment.planType} em ${date}.\n\nValidade/Vencimento do plano: ${expiryDate}\n\nObrigado por treinar conosco!\n\nCT KRAV MAGÁ IPIRANGA\nRua Tabor, 482 - Ipiranga\nTel: 11 2589-6049\nKida!`;

    window.location.href = `mailto:${student.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const exportAsImage = async () => {
    if (receiptRef.current === null) return;
    
    setIsExporting(true);
    try {
      // Pequeno delay para garantir que o DOM está pronto
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await toPng(receiptRef.current, { 
        cacheBust: true,
        backgroundColor: '#ffffff',
        style: {
            borderRadius: '0', // Remove arredondamento no export se desejar
        }
      });
      
      const link = document.createElement('a');
      link.download = `recibo_${payment.studentName.replace(/\s+/g, '_').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Imagem Gerada!",
        description: "O recibo foi baixado como PNG com sucesso.",
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Erro ao exportar",
        description: "Não foi possível gerar a imagem do recibo.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 p-4 sm:p-8 print:p-0 print:bg-white">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 print:hidden">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.close()}>
              Fechar Aba
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
            <Button variant="outline" size="sm" onClick={shareViaWhatsApp} className="flex-1 sm:flex-none">
              <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={shareViaEmail} className="flex-1 sm:flex-none">
              <Mail className="mr-2 h-4 w-4" /> E-mail
            </Button>
            <Button variant="outline" size="sm" onClick={exportAsImage} disabled={isExporting} className="flex-1 sm:flex-none">
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
              Imagem (PNG)
            </Button>
            <Button size="sm" onClick={() => window.print()} className="flex-1 sm:flex-none">
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
          </div>
        </div>

        <div 
          ref={receiptRef}
          className="bg-white border rounded-xl shadow-sm p-6 sm:p-10 space-y-8 print:border-none print:shadow-none"
        >
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
              <span className="text-xs sm:text-sm font-bold uppercase text-muted-foreground tracking-wider">Valor Recebido</span>
              <span className="text-2xl sm:text-3xl font-black text-primary">R$ {payment.amount.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Aluno</p>
                <p className="text-base font-bold">{payment.studentName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Referente a</p>
                <p className="text-base font-bold">{payment.planType}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Data do Pagamento</p>
                <p className="text-base font-bold">{format(parseISO(payment.paymentDate), 'dd/MM/yyyy')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Forma de Pagamento</p>
                <p className="text-base font-bold">{payment.paymentMethod}</p>
              </div>
              {payment.expirationDate && (
                <div className="space-y-1 sm:col-span-2 border-t pt-4 mt-2 bg-primary/5 p-3 rounded">
                  <p className="text-primary font-black uppercase text-[10px] tracking-widest">Vencimento / Validade do Plano</p>
                  <p className="text-lg font-black text-primary">
                    {format(parseISO(payment.expirationDate), 'dd/MM/yyyy')}
                  </p>
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