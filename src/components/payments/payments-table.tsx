
"use client"

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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash2, FileText } from "lucide-react"
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

interface PaymentsTableProps {
  payments: Payment[];
  allStudents: Student[];
  isLoading: boolean;
}

export function PaymentsTable({ payments, allStudents, isLoading }: PaymentsTableProps) {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

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

  const handleOpenReceipt = (paymentId: string) => {
    window.open(`/pagamentos/${paymentId}/recibo`, '_blank');
  }
  
  return (
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
                         <DropdownMenuItem onSelect={() => handleOpenReceipt(payment.id)}>
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
  )
}
