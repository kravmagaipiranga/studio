
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
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Exam } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"

interface ExamsTableProps {
  exams: Exam[];
  isLoading: boolean;
}

export function ExamsTable({ exams, isLoading }: ExamsTableProps) {
  
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Inscrições de Exame</CardTitle>
          <CardDescription>
            Acompanhe as inscrições e pagamentos para os próximos exames de faixa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead className="hidden sm:table-cell">CPF</TableHead>
                <TableHead className="hidden sm:table-cell">Idade</TableHead>
                <TableHead className="hidden md:table-cell">Data do Exame</TableHead>
                <TableHead>Faixa Pretendida</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({length: 3}).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && exams.map((exam: Exam) => (
                <TableRow key={exam.id}>
                  <TableCell>
                     <div className="font-medium">{exam.studentName}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {exam.studentCpf}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {exam.studentAge}
                  </TableCell>
                   <TableCell className="hidden md:table-cell">
                      {new Date(exam.examDate + "T00:00:00").toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                     <Badge variant="secondary">{exam.targetBelt}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={exam.paymentStatus === 'Pago' ? 'outline' : 'destructive'}>
                      {exam.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {`R$ ${exam.paymentAmount.toFixed(2)}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem>
                          Registrar Pagamento
                        </DropdownMenuItem>
                        <DropdownMenuItem>Ver Detalhes do Aluno</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
               {!isLoading && exams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    Nenhum exame agendado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
