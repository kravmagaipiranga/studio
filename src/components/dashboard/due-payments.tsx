
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
import { Mail, MessageCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { Student } from "@/lib/types"
import { collection, query, where } from "firebase/firestore"
import { useMemo } from "react"
import { Skeleton } from "../ui/skeleton"

export function DuePayments() {
  const firestore = useFirestore();

  const overdueStudentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'students'), where('paymentStatus', '==', 'Vencido'));
  }, [firestore]);

  const { data: overdueStudents, isLoading } = useCollection<Student>(overdueStudentsQuery);

  const openWhatsApp = (studentName: string) => {
    const message = encodeURIComponent(`Olá ${studentName}, este é um lembrete amigável sobre seu pagamento pendente para o Krav Magá IPIRANGA.`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mensalidades Vencidas</CardTitle>
        <CardDescription>
          Alunos com pagamentos vencidos este mês.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead className="hidden sm:table-cell">Plano</TableHead>
              <TableHead className="hidden md:table-cell">Vencimento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {isLoading && Array.from({ length: 2 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="grid gap-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
              </TableRow>
            ))}
            {!isLoading && overdueStudents && overdueStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <div className="grid gap-1">
                      <p className="text-sm font-medium leading-none">
                        {student.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {student.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="outline">{student.planType}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {student.planExpirationDate ? new Date(student.planExpirationDate + "T00:00:00").toLocaleDateString('pt-BR') : 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  <TooltipProvider>
                    <div className="flex items-center justify-end gap-2">
                       <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" onClick={() => openWhatsApp(student.name)}>
                            <MessageCircle className="h-4 w-4" />
                            <span className="sr-only">Enviar WhatsApp</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Lembrete via WhatsApp</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Mail className="h-4 w-4" />
                            <span className="sr-only">Enviar Email</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Lembrete via Email</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && (!overdueStudents || overdueStudents.length === 0) && (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        Nenhum pagamento vencido.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
