
"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash2, FileText, Printer, MessageSquare, Mail, ShieldCheck } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Payment, Student } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { useRouter } from "next/navigation"
import { useFirestore, deleteDocumentNonBlocking } from "@/firebase"
import { doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

interface PaymentsTableProps {
  payments: Payment[];
  allStudents: Student[];
  isLoading: boolean;
}

export function PaymentsTable({ payments, allStudents, isLoading }: PaymentsTableProps) {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const handleDelete = (payment: Payment) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'payments', payment.id);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: "Pagamento Excluído",
      description: `O registro de pagamento para ${payment.studentName} foi removido.`
    })
  }

  const getStatus = (payment: Payment): { text: 'Válido' | 'Expirado' | 'N/A', variant: 'outline' | 'destructive' | 'secondary' } => {
    if (!payment.expirationDate) {
      return { text: 'N/A', variant: 'secondary' };
    }
    try {
        const expiration = new Date(payment.expirationDate + 'T00:00:00');
        const today = new Date();
        today.setHours(0,0,0,0);
        return expiration < today ? { text: 'Expirado', variant: 'destructive' } : { text: 'Válido', variant: 'outline' };
    } catch {
        return { text: 'Expirado', variant: 'destructive' };
    }
  }

  const handleOpenReceipt = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowReceipt(true);
  }

  const shareViaWhatsApp = () => {
    if (!selectedPayment) return;
    const student = allStudents.find(s => s.id === selectedPayment.studentId);
    if (!student || !student.phone) {
        toast({ variant: "destructive", title: "Erro", description: "WhatsApp do aluno não cadastrado." });
        return;
    }

    const cleanPhone = student.phone.replace(/\D/g, '');
    const date = format(parseISO(selectedPayment.paymentDate), 'dd/MM/yyyy');
    const message = `*RECIBO DE PAGAMENTO - Krav Magá Ipiranga*\n\n` +
                    `Recebemos de: *${selectedPayment.studentName}*\n` +
                    `Valor: *R$ ${selectedPayment.amount.toFixed(2)}*\n` +
                    `Referente a: *${selectedPayment.planType}*\n` +
                    `Data do Pagamento: *${date}*\n` +
                    `Forma de Pagamento: *${selectedPayment.paymentMethod}*\n\n` +
                    `Agradecemos a preferência! Kida! 👊`;

    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  }

  const shareViaEmail = () => {
    if (!selectedPayment) return;
    const student = allStudents.find(s => s.id === selectedPayment.studentId);
    if (!student || !student.email) {
        toast({ variant: "destructive", title: "Erro", description: "E-mail do aluno não cadastrado." });
        return;
    }

    const date = format(parseISO(selectedPayment.paymentDate), 'dd/MM/yyyy');
    const subject = `Recibo de Pagamento - Krav Magá Ipiranga`;
    const body = `Olá, ${selectedPayment.studentName}!\n\nConfirmamos o recebimento do seu pagamento no valor de R$ ${selectedPayment.amount.toFixed(2)} referente ao plano ${selectedPayment.planType} em ${date}.\n\nObrigado por treinar conosco!\n\nKrav Magá Ipiranga\nKida!`;

    window.location.href = `mailto:${student.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
          <CardDescription>
            Todos os pagamentos registrados, ordenados por data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data Pgto.</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && payments.map((payment: Payment) => {
                const status = getStatus(payment);
                return (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="font-medium">{payment.studentName}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{payment.planType}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(payment.paymentDate + "T00:00:00").toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                       {payment.expirationDate ? new Date(payment.expirationDate + "T00:00:00").toLocaleDateString('pt-BR') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {`R$ ${payment.amount.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>
                        {status.text}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                           <DropdownMenuItem onSelect={() => handleOpenReceipt(payment)}>
                             <FileText className="mr-2 h-4 w-4" />
                             Gerar Recibo
                          </DropdownMenuItem>
                           <DropdownMenuItem onSelect={() => router.push(`/alunos/${payment.studentId}/editar`)}>
                            Ver Aluno
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => handleDelete(payment)} className="text-red-600">
                             <Trash2 className="mr-2 h-4 w-4" />
                            Excluir Registro
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
              {!isLoading && payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Nenhum pagamento registrado encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Recibo de Pagamento
                </DialogTitle>
                <DialogDescription>Visualize e compartilhe o comprovante.</DialogDescription>
            </DialogHeader>
            
            {selectedPayment && (
                <div id="receipt-content" className="p-6 border rounded-lg bg-white space-y-6 text-sm">
                    <div className="text-center border-b pb-4 space-y-1">
                        <h2 className="text-lg font-bold uppercase tracking-tight">Krav Magá IPIRANGA</h2>
                        <p className="text-xs text-muted-foreground">Centro de Treinamento de Defesa Pessoal</p>
                        <p className="text-xs text-muted-foreground">CNPJ: 31.116.136/0001-95</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Aluno:</span>
                            <span className="font-bold">{selectedPayment.studentName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Valor:</span>
                            <span className="font-bold text-lg">R$ {selectedPayment.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Referente a:</span>
                            <span className="font-medium">{selectedPayment.planType}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Data do Pagamento:</span>
                            <span className="font-medium">{format(parseISO(selectedPayment.paymentDate), 'dd/MM/yyyy')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Forma de Pagamento:</span>
                            <span className="font-medium">{selectedPayment.paymentMethod}</span>
                        </div>
                        {selectedPayment.expirationDate && (
                            <div className="flex justify-between border-t pt-2 mt-2">
                                <span className="text-muted-foreground">Vencimento do Plano:</span>
                                <span className="font-medium">{format(parseISO(selectedPayment.expirationDate), 'dd/MM/yyyy')}</span>
                            </div>
                        )}
                    </div>

                    <div className="text-center pt-6 text-[10px] text-muted-foreground italic">
                        Este é um recibo eletrônico gerado pelo sistema de gestão do CT Krav Magá Ipiranga.
                    </div>
                </div>
            )}

            <DialogFooter className="grid grid-cols-2 sm:grid-cols-2 gap-2 w-full">
                <Button variant="outline" className="w-full" onClick={shareViaWhatsApp}>
                    <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp
                </Button>
                <Button variant="outline" className="w-full" onClick={shareViaEmail}>
                    <Mail className="mr-2 h-4 w-4" /> E-mail
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" /> Imprimir
                </Button>
                <Button variant="default" className="w-full" onClick={() => setShowReceipt(false)}>
                    Fechar
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
