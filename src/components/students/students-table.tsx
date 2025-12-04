"use client"

import { useRouter } from "next/navigation"
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

interface StudentsTableProps {
  students: Student[];
  isLoading: boolean;
}

export function StudentsTable({ students, isLoading }: StudentsTableProps) {
  const router = useRouter();

  const handleRowClick = (studentId: string) => {
    router.push(`/alunos/${studentId}/editar`);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Alunos</CardTitle>
          <CardDescription>
            Uma lista de todos os alunos cadastrados. Clique em um aluno para editar.
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  </TableRow>
              ))}
              {!isLoading && students.map((student: Student) => (
                <TableRow 
                  key={student.id} 
                  onClick={() => handleRowClick(student.id)}
                  className="cursor-pointer"
                >
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
                </TableRow>
              ))}
               {!isLoading && students.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
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
