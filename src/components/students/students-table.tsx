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
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Student } from "@/lib/types"

export function StudentsTable() {
  
  return (
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
              <TableHead className="hidden w-[100px] sm:table-cell">
                <span className="sr-only">Avatar</span>
              </TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead className="hidden md:table-cell">
                Status
              </TableHead>
              <TableHead className="hidden md:table-cell">
                Data de Inscrição
              </TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student: Student) => (
              <TableRow key={student.id}>
                <TableCell className="hidden sm:table-cell">
                  <Avatar className="h-9 w-9">
                      <AvatarImage src={student.avatar} alt="Avatar" data-ai-hint="person face" />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{student.name}
                  <div className="text-sm text-muted-foreground md:hidden">
                    {student.email}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{student.plan}</Badge>
                </TableCell>
                 <TableCell className="hidden md:table-cell">
                    <Badge variant={
                        student.status === 'Ativo' ? 'default' : 
                        student.status === 'Inativo' ? 'secondary': 
                        'destructive'
                    }>
                        {student.status}
                    </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {new Date(student.registrationDate).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
