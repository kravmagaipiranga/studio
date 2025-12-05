
"use client"

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
import { Save, Trash2 } from "lucide-react"
import { Sale, Student } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { useFirestore, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Combobox } from "../ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "../ui/textarea"

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

  const handleDeleteSale = (itemId: string, itemName: string) => {
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

  return (
      <div className="w-full border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Detalhes da Venda</TableHead>
                <TableHead className="text-right w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
               {isLoading && Array.from({length: 3}).map((_, index) => (
                 <TableRow key={index}>
                    <TableCell colSpan={2}><Skeleton className="h-24 w-full" /></TableCell>
                 </TableRow>
              ))}
              {!isLoading && sales.map((sale: Sale) => (
                <TableRow key={sale.id} className={sale.isNew ? "bg-muted/50" : ""}>
                  <TableCell className="p-4">
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
                                <SelectItem value="Cartão">Cartão</SelectItem>
                                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                              </SelectContent>
                            </Select>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="align-top text-right p-4">
                    <div className="flex flex-col items-center justify-start gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleSaveSale(sale)}>
                            <Save className="h-4 w-4" />
                            <span className="sr-only">Salvar</span>
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteSale(sale.id, sale.item)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && sales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-10">
                    Nenhuma venda encontrada. Clique em "Nova Venda" para adicionar uma.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
      </div>
  )
}
