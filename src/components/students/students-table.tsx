
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
import { Student } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { Button } from "../ui/button"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


interface StudentsTableProps {
  students: Student[];
  isLoading: boolean;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

export function StudentsTable({ students, isLoading, onEdit, onDelete }: StudentsTableProps) {
  
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Alunos</CardTitle>
          <CardDescription>
            Uma lista de todos os alunos cadastrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Graduação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
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
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
              ))}
              {!isLoading && students.map((student: Student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{student.belt}</Badge>
                  </TableCell>
                  <TableCell>
                      <Badge variant={student.status === 'Ativo' ? 'default' : 'secondary'}>
                          {student.status}
                      </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.paymentStatus === 'Pago' ? 'outline' : 'destructive'}>
                      {student.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => onEdit(student)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onDelete(student)} className="text-destructive">
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
               {!isLoading && students.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        Nenhum aluno encontrado.
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
