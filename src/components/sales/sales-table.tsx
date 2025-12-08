
"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Save, Trash2, ChevronsUpDown } from "lucide-react"
import { Sale, Student } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { useFirestore, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Combobox } from "../ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "../ui/textarea"
import { cn } from "@/lib/utils"

interface SalesTableProps {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  allStudents: Student[];
  isLoading: boolean;
}

export function SalesTable({ sales, setSales, allStudents, isLoading }: SalesTableProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const studentOptions = allStudents.slice().sort((a,b) => a.name.localeCompare(b.name)).map(s => ({ value: s.id, label: s.name }));

  const handleInputChange = (saleId: string, field: keyof Sale, value: any) => {
    setSales(prev =>
      prev.map(item => {
        if (item.id === saleId) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'studentId' && item.isNew) {
            const selectedStudent = allStudents.find(s => s.id === value);
            if (selectedStudent) {
              updatedItem.studentName = selectedStudent.name;
            }
          }
          return updatedItem;
        }
        return item;
      })
    );
  };
  
  const handleSaveSale = (itemToSave: Sale) => {
    if (!firestore) return;

    if (!itemToSave.studentId || !itemToSave.item || !itemToSave.date) {
        toast({
            variant: "destructive",
            title: "Campos Obrigatórios",
            description: "Por favor, preencha Aluno, Item e Data antes de salvar."
        });
        return;
    }

    const { isNew, id, ...itemData } = itemToSave;
    const finalId = isNew ? doc(collection(firestore, "sales")).id : id;

    const docRef = doc(firestore, 'sales', finalId);
    setDocumentNonBlocking(docRef, { ...itemData, id: finalId }, { merge: true });

    toast({
        title: "Venda Salva!",
        description: `A venda do item ${itemData.item} foi salva com sucesso.`
    });
    
    setSales(prev => prev.map(ex => ex.id === itemToSave.id ? { ...itemData, id: finalId, isNew: false } : ex));
  };

  const handleDeleteSale = (e: React.MouseEvent, itemId: string, itemName: string) => {
    e.stopPropagation(); // Prevent accordion from toggling
    if (!firestore) return;
    
    const isNewRow = itemId.startsWith('new_');
    if (isNewRow) {
        setSales(prev => prev.filter(ex => ex.id !== itemId));
        return;
    }

    const docRef = doc(firestore, 'sales', itemId);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Venda Removida",
        description: `A venda do item ${itemName} foi removida.`
    })
  };

  const getStatusVariant = (status: 'Pago' | 'Pendente'): 'default' | 'destructive' => {
      return status === 'Pago' ? 'default' : 'destructive';
  }

  if (isLoading) {
      return (
          <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
          </div>
      )
  }

  return (
      <div className="w-full border rounded-lg overflow-hidden">
        {sales.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {sales.map((sale: Sale) => (
                <AccordionItem value={sale.id} key={sale.id} className={cn("px-4", sale.isNew && "bg-muted/50")}>
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex-1 text-left font-medium">{sale.studentName || "Novo Registro"}</div>
                            <div className="flex-1 text-left text-muted-foreground">{sale.item || "..."}</div>
                            <div className="flex-1 text-left font-semibold">R$ {sale.value.toFixed(2)}</div>
                            <div className="flex-1 text-left">
                                <Badge variant={getStatusVariant(sale.paymentStatus)}>{sale.paymentStatus}</Badge>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">Aluno</label>
                                {sale.isNew ? (
                                <Combobox
                                    options={studentOptions}
                                    value={sale.studentId}
                                    onChange={(value) => handleInputChange(sale.id, 'studentId', value)}
                                    placeholder="Selecione..."
                                    searchPlaceholder="Buscar aluno..."
                                    notFoundText="Nenhum aluno encontrado."
                                />
                                ) : (
                                <Input disabled value={sale.studentName} />
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">Data da Venda</label>
                                <Input type="date" value={sale.date} onChange={e => handleInputChange(sale.id, 'date', e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2 mt-4">
                            <label className="text-xs font-semibold text-muted-foreground">Item / Descrição</label>
                            <Textarea placeholder="Ex: Uniforme completo, Faixa, etc." value={sale.item} onChange={e => handleInputChange(sale.id, 'item', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">Valor (R$)</label>
                                <Input type="number" value={sale.value} onChange={e => handleInputChange(sale.id, 'value', parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">Status do Pagamento</label>
                                <Select value={sale.paymentStatus} onValueChange={(value) => handleInputChange(sale.id, 'paymentStatus', value)}>
                                <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pago">Pago</SelectItem>
                                    <SelectItem value="Pendente">Pendente</SelectItem>
                                </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">Forma de Pagamento</label>
                                <Select value={sale.paymentMethod} onValueChange={(value) => handleInputChange(sale.id, 'paymentMethod', value)}>
                                <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pendente">Pendente</SelectItem>
                                    <SelectItem value="Pix">Pix</SelectItem>
                                    <SelectItem value="Boleto">Boleto</SelectItem>
                                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="destructive" onClick={(e) => handleDeleteSale(e, sale.id, sale.item)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                            </Button>
                            <Button onClick={() => handleSaveSale(sale)}>
                                <Save className="h-4 w-4 mr-2" />
                                Salvar Venda
                            </Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
          </Accordion>
        ) : (
            <div className="text-center py-10 text-muted-foreground">
                Nenhuma venda encontrada. Clique em "Nova Venda" para adicionar uma.
            </div>
        )}
      </div>
  )
}
