
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
import { Sale, Student } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { useState } from "react"
import { SaleFormDialog } from "./sale-form-dialog"

interface SalesTableProps {
  sales: Sale[];
  isLoading: boolean;
  allStudents: Student[];
}

export function SalesTable({ sales, isLoading, allStudents }: SalesTableProps) {
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
  };
  
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Histórico de Vendas</CardTitle>
          <CardDescription>
            Vendas de produtos como uniformes, equipamentos, etc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="hidden sm:table-cell">Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Forma Pgto.</TableHead>
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
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                 </TableRow>
              ))}
              {!isLoading && sales.map((sale: Sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.studentName}</TableCell>
                  <TableCell>{sale.item}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {new Date(sale.date + "T00:00:00").toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={sale.paymentStatus === 'Pago' ? 'outline' : 'destructive'}>
                      {sale.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                     {sale.paymentMethod}
                  </TableCell>
                  <TableCell className="text-right">
                    {`R$ ${sale.value.toFixed(2)}`}
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
                        <DropdownMenuItem onClick={() => handleEdit(sale)}>
                          Editar/Registrar Pagamento
                        </DropdownMenuItem>
                         <DropdownMenuItem className="text-destructive">
                          Cancelar Venda
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && sales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    Nenhuma venda encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {editingSale && (
        <SaleFormDialog
            isOpen={!!editingSale}
            onOpenChange={(isOpen) => !isOpen && setEditingSale(null)}
            sale={editingSale}
            allStudents={allStudents}
        />
      )}
    </>
  )
}

    