
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
import { Seminar } from "@/lib/types"

interface SeminarsTableProps {
  seminars: Seminar[];
}

export function SeminarsTable({ seminars }: SeminarsTableProps) {
  
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Inscrições em Seminários</CardTitle>
          <CardDescription>
            Acompanhe as inscrições e pagamentos para os próximos seminários e cursos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tema</TableHead>
                <TableHead>Aluno</TableHead>
                <TableHead className="hidden sm:table-cell">Faixa</TableHead>
                <TableHead className="hidden md:table-cell">CPF</TableHead>
                <TableHead className="hidden md:table-cell">Idade</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Forma Pgto.</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seminars.map((seminar: Seminar) => (
                <TableRow key={seminar.id}>
                  <TableCell className="font-medium">{seminar.topic}</TableCell>
                  <TableCell>{seminar.studentName}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary">{seminar.studentBelt}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{seminar.studentCpf}</TableCell>
                  <TableCell className="hidden md:table-cell">{seminar.studentAge}</TableCell>
                  <TableCell>
                    <Badge variant={seminar.paymentStatus === 'Pago' ? 'outline' : 'destructive'}>
                      {seminar.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                     {seminar.paymentMethod}
                  </TableCell>
                  <TableCell className="text-right">
                    {`R$ ${seminar.paymentAmount.toFixed(2)}`}
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
