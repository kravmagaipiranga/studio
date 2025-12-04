
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
import { MoreHorizontal, MessageCircle, Info } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Student } from "@/lib/types"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Skeleton } from "../ui/skeleton"
import { useRouter } from "next/navigation"

interface PaymentsTableProps {
  students: Student[];
  isLoading: boolean;
  allStudents: Student[];
}

export function PaymentsTable({ students, isLoading }: PaymentsTableProps) {
  const router = useRouter();

  const openWhatsApp = (studentName: string) => {
    const message = encodeURIComponent(`Olá ${studentName}, este é um lembrete amigável sobre seu pagamento pendente para o Krav Magá IPIRANGA.`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };
  
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>
            Detalhes financeiros e status de pagamento dos alunos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead className="hidden sm:table-cell">Plano</TableHead>
                <TableHead className="hidden sm:table-cell">Valor</TableHead>
                <TableHead className="hidden md:table-cell">Último Pgto.</TableHead>
                <TableHead className="hidden md:table-cell">Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {isLoading && Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && students.map((student: Student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="font-medium">{student.name}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">{student.planType || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {student.planValue ? `R$ ${student.planValue.toFixed(2)}` : 'N/A'}
                  </TableCell>
                   <TableCell className="hidden md:table-cell">
                      {student.lastPaymentDate ? new Date(student.lastPaymentDate + "T00:00:00").toLocaleDateString('pt-BR') : 'N/A'}
                  </TableCell>
                   <TableCell className="hidden md:table-cell">
                      {student.planExpirationDate ? new Date(student.planExpirationDate + "T00:00:00").toLocaleDateString('pt-BR') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.paymentStatus === 'Pago' ? 'outline' : 'destructive'}>
                      {student.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {student.paymentCredits && (
                        <TooltipProvider>
                           <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-700">
                                <Info className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Créditos: {student.paymentCredits}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {student.paymentStatus === 'Vencido' && (
                         <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => openWhatsApp(student.name)}>
                                <MessageCircle className="h-4 w-4" />
                                <span className="sr-only">Cobrar via WhatsApp</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Cobrar via WhatsApp</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => router.push(`/pagamentos/novo/editar?aluno=${student.id}`)}>
                          Registrar Pagamento
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {!isLoading && students.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                Nenhum aluno para exibir.
            </div>
           )}
        </CardContent>
      </Card>
    </>
  )
}
