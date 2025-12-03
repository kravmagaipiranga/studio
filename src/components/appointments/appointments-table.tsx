
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
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Appointment } from "@/lib/types"

interface AppointmentsTableProps {
  appointments: Appointment[];
}

export function AppointmentsTable({ appointments }: AppointmentsTableProps) {
  
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Agendamentos Futuros</CardTitle>
          <CardDescription>
            Aulas experimentais e outros agendamentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">WhatsApp</TableHead>
                <TableHead className="hidden md:table-cell">E-mail</TableHead>
                <TableHead>Data da Aula</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead className="hidden lg:table-cell">Anotações</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment: Appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell className="font-medium">{appointment.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {appointment.whatsapp}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {appointment.email}
                  </TableCell>
                  <TableCell>
                    {new Date(appointment.classDate + "T00:00:00").toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>{appointment.classTime}</TableCell>
                  <TableCell className="hidden lg:table-cell">{appointment.notes}</TableCell>
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
                          Editar Agendamento
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Confirmar Presença
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Cancelar Agendamento
                        </DropdownMenuItem>
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
