
"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Save, Trash2, PackageCheck } from "lucide-react"
import { UniformOrder, Student } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { useFirestore, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Combobox } from "../ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "../ui/textarea"
import { cn } from "@/lib/utils"
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";

interface UniformsTableProps {
  orders: UniformOrder[];
  setOrders: React.Dispatch<React.SetStateAction<UniformOrder[]>>;
  allStudents: Student[];
  isLoading: boolean;
}

export function UniformsTable({ orders, setOrders, allStudents, isLoading }: UniformsTableProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const studentOptions = allStudents.slice().sort((a,b) => a.name.localeCompare(b.name)).map(s => ({ value: s.id, label: s.name }));

  const handleInputChange = (orderId: string, field: keyof UniformOrder, value: any) => {
    setOrders(prev =>
      prev.map(item => {
        if (item.id === orderId) {
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
  
  const handleSaveOrder = (itemToSave: UniformOrder) => {
    if (!firestore) return;

    if (!itemToSave.studentId || !itemToSave.items || !itemToSave.orderDate) {
        toast({
            variant: "destructive",
            title: "Campos Obrigatórios",
            description: "Por favor, preencha Aluno, Itens e Data do Pedido antes de salvar."
        });
        return;
    }

    const { isNew, id, ...itemData } = itemToSave;
    const finalId = isNew ? doc(collection(firestore, "uniformOrders")).id : id;

    const docRef = doc(firestore, 'uniformOrders', finalId);
    setDocumentNonBlocking(docRef, { ...itemData, id: finalId }, { merge: true });

    toast({
        title: "Pedido Salvo!",
        description: `O pedido de ${itemData.studentName} foi salvo com sucesso.`
    });
    
    setOrders(prev => prev.map(ex => ex.id === itemToSave.id ? { ...itemData, id: finalId, isNew: false } : ex));
  };

  const handleDeleteOrder = (e: React.MouseEvent, itemId: string, studentName: string) => {
    e.stopPropagation();
    if (!firestore) return;
    
    const isNewRow = itemId.startsWith('new_');
    if (isNewRow) {
        setOrders(prev => prev.filter(ex => ex.id !== itemId));
        return;
    }

    const docRef = doc(firestore, 'uniformOrders', itemId);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Pedido Removido",
        description: `O pedido de ${studentName} foi removido.`
    })
  };

  const getStatusVariant = (status: 'Pago' | 'Pendente'): 'default' | 'destructive' => {
      return status === 'Pago' ? 'default' : 'destructive';
  }

  if (isLoading) {
      return (
          <div className="space-y-2 w-full">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
          </div>
      )
  }

  return (
    <div className="w-full border rounded-lg overflow-hidden">
        {orders.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {orders.map((order: UniformOrder) => (
              <AccordionItem value={order.id} key={order.id} className={cn("px-4", order.isNew && "bg-muted/50")}>
                <AccordionTrigger className="hover:no-underline">
                   <div className="flex items-center justify-between w-full">
                        <div className="flex-1 text-left font-medium">{order.studentName || "Novo Pedido"}</div>
                        <div className="flex-1 text-left text-muted-foreground">
                            {new Date(order.orderDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex-1 text-left font-semibold">R$ {order.totalValue.toFixed(2)}</div>
                        <div className="flex-1 text-left flex items-center gap-2">
                            <Badge variant={getStatusVariant(order.paymentStatus)}>{order.paymentStatus}</Badge>
                            {order.materialPickedUp && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                    <PackageCheck className="h-3 w-3" />
                                    Retirado
                                </Badge>
                            )}
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground">Aluno</label>
                            {order.isNew ? (
                            <Combobox
                                options={studentOptions}
                                value={order.studentId}
                                onChange={(value) => handleInputChange(order.id, 'studentId', value)}
                                placeholder="Selecione..."
                                searchPlaceholder="Buscar aluno..."
                                notFoundText="Nenhum aluno encontrado."
                            />
                            ) : (
                            <Input disabled value={order.studentName} />
                            )}
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-semibold text-muted-foreground">Data do Pedido</label>
                            <Input 
                                type="date"
                                value={order.orderDate} 
                                onChange={e => handleInputChange(order.id, 'orderDate', e.target.value)} 
                            />
                        </div>
                    </div>
                     <div className="space-y-2 mt-4">
                        <label className="text-xs font-semibold text-muted-foreground">Itens Solicitados</label>
                        <Textarea
                            placeholder="Ex: 1 Camiseta M, 1 Calça 42, 1 Luva G..."
                            value={order.items}
                            onChange={e => handleInputChange(order.id, 'items', e.target.value)}
                        />
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 items-end">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground">Valor Total (R$)</label>
                            <Input type="number" value={order.totalValue} onChange={e => handleInputChange(order.id, 'totalValue', parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground">Status do Pagamento</label>
                            <Select value={order.paymentStatus} onValueChange={(value) => handleInputChange(order.id, 'paymentStatus', value)}>
                                <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pago">Pago</SelectItem>
                                    <SelectItem value="Pendente">Pendente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                           <label className="text-xs font-semibold text-muted-foreground">Data do Pagamento</label>
                            <Input 
                                type="date"
                                value={order.paymentDate || ''} 
                                onChange={e => handleInputChange(order.id, 'paymentDate', e.target.value)} 
                                disabled={order.paymentStatus !== 'Pago'}
                            />
                        </div>
                        <div className="flex items-center space-x-2 border rounded-md p-2 h-10">
                            <Switch 
                                id={`picked-up-${order.id}`} 
                                checked={order.materialPickedUp}
                                onCheckedChange={checked => handleInputChange(order.id, 'materialPickedUp', checked)}
                            />
                            <Label htmlFor={`picked-up-${order.id}`}>Material Retirado</Label>
                        </div>
                    </div>

                    <div className="flex justify-end items-center mt-6 gap-2">
                        <Button variant="destructive" onClick={(e) => handleDeleteOrder(e, order.id, order.studentName)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                        </Button>
                        <Button onClick={() => handleSaveOrder(order)}>
                            <Save className="h-4 w-4 mr-2" />
                            Salvar Pedido
                        </Button>
                    </div>

                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
            <div className="text-center py-10 text-muted-foreground">
              Nenhum pedido de uniforme encontrado.
            </div>
        )}
    </div>
  )
}
