
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
import { Seminar, Student } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { useState } from "react"
import { SeminarFormDialog } from "./seminar-form-dialog"

interface SeminarsTableProps {
  seminars: Seminar[];
  isLoading: boolean;
  allStudents: Student[];
}

export function SeminarsTable({ seminars, isLoading, allStudents }: SeminarsTableProps) {
  const [editingSeminar, setEditingSeminar] = useState<Seminar | null>(null);

  const handleEdit = (seminar: Seminar) => {
    setEditingSeminar(seminar);
  };
  
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
              {isLoading && Array.from({length: 3}).map((_, index) => (
                 <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                 </TableRow>
              ))}
              {!isLoading && seminars.map((seminar: Seminar) => (
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
                        <DropdownMenuItem onClick={() => handleEdit(seminar)}>
                          Editar/Registrar Pagamento
                        </DropdownMenuItem>
                        <DropdownMenuItem>Ver Detalhes do Aluno</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
               {!isLoading && seminars.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10">
                    Nenhuma inscrição em seminário encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {editingSeminar && (
        <SeminarFormDialog
          isOpen={!!editingSeminar}
          onOpenChange={(isOpen) => !isOpen && setEditingSeminar(null)}
          seminar={editingSeminar}
          allStudents={allStudents}
        />
      )}
    </>
  )
}
    