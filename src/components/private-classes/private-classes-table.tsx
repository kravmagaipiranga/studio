
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
import { PrivateClass } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { useRouter } from "next/navigation"

interface PrivateClassesTableProps {
  privateClasses: PrivateClass[];
  isLoading: boolean;
}

export function PrivateClassesTable({ privateClasses, isLoading }: PrivateClassesTableProps) {
  const router = useRouter();
  
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Aulas Agendadas</CardTitle>
          <CardDescription>
            Acompanhe as aulas particulares agendadas e seus pagamentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead className="hidden sm:table-cell">Faixa</TableHead>
                <TableHead>Data da Aula</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Forma Pgto.</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({length: 2}).map((_, index) => (
                 <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                 </TableRow>
              ))}
              {!isLoading && privateClasses.map((pc: PrivateClass) => (
                <TableRow key={pc.id}>
                  <TableCell className="font-medium">{pc.studentName}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary">{pc.studentBelt}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(pc.classDate + "T00:00:00").toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={pc.paymentStatus === 'Pago' ? 'outline' : 'destructive'}>
                      {pc.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                     {pc.paymentMethod}
                  </TableCell>
                  <TableCell className="text-right">
                    {`R$ ${pc.paymentAmount.toFixed(2)}`}
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
                        <DropdownMenuItem onClick={() => router.push(`/aulas/${pc.id}/editar`)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/alunos/${pc.studentId}`)}>
                          Ver Detalhes do Aluno
                        </DropdownMenuItem>
                         <DropdownMenuItem className="text-destructive">
                          Cancelar Aula
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
               {!isLoading && privateClasses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    Nenhuma aula particular agendada.
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
