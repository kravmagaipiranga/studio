"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { students } from "@/lib/data"
import { MoreHorizontal, MessageCircle, Mail, Info } from "lucide-react"
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

export function PaymentsTable() {

  const openWhatsApp = (studentName: string) => {
    const message = encodeURIComponent(`Olá ${studentName}, este é um lembrete amigável sobre seu pagamento pendente para o Krav Magá IPIRANGA.`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };
  
  return (
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
            {students.map((student: Student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="hidden h-9 w-9 sm:flex">
                        <AvatarImage src={student.avatar} alt="Avatar" data-ai-hint="person face" />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                     <div className="font-medium">{student.name}</div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="outline">{student.planType || 'N/A'}</Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {student.planValue ? `R$ ${student.planValue.toFixed(2)}` : 'N/A'}
                </TableCell>
                 <TableCell className="hidden md:table-cell">
                    {student.lastPaymentDate ? new Date(student.lastPaymentDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}) : 'N/A'}
                </TableCell>
                 <TableCell className="hidden md:table-cell">
                    {student.planExpirationDate ? new Date(student.planExpirationDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'}) : 'N/A'}
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
                      <DropdownMenuItem>Registrar Pagamento</DropdownMenuItem>
                      <DropdownMenuItem>Editar Informações</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
