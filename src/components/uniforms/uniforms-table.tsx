
"use client"

import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Save, Trash2, PackageCheck, PlusCircle, X } from "lucide-react"
import { UniformOrder, Student, OrderItem } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { useFirestore, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Combobox } from "../ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils"
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UNIFORM_ITEMS } from "@/lib/uniform-items";
import { v4 as uuidv4 } from 'uuid';

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

  const updateOrder = (orderId: string, updatedFields: Partial<UniformOrder>) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id === orderId) {
          const newOrder = { ...order, ...updatedFields };
          // Recalculate total value if items change
          if (updatedFields.items) {
            newOrder.totalValue = newOrder.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
          }
          return newOrder;
        }
        return order;
      })
    );
  };
  
  const handleStudentChange = (orderId: string, studentId: string) => {
    const student = allStudents.find(s => s.id === studentId);
    updateOrder(orderId, { studentId, studentName: student?.name || "" });
  };

  const handleItemChange = (orderId: string, itemId: string, field: keyof OrderItem, value: any) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const newItems = order.items.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    );
    updateOrder(orderId, { items: newItems });
  };

  const handleAddItem = (orderId: string, predefinedItem: { name: string; price: number; sizes: string[] }) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const newItem: OrderItem = {
      id: uuidv4(),
      name: predefinedItem.name,
      price: predefinedItem.price,
      size: predefinedItem.sizes[0] || "",
      quantity: 1,
    };
    updateOrder(orderId, { items: [...order.items, newItem] });
  };

  const handleAddCustomItem = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const newItem: OrderItem = {
      id: uuidv4(),
      name: "Item Personalizado",
      price: 0,
      size: "Único",
      quantity: 1,
    };
    updateOrder(orderId, { items: [...order.items, newItem] });
  };

  const handleRemoveItem = (orderId: string, itemId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const newItems = order.items.filter(item => item.id !== itemId);
    updateOrder(orderId, { items: newItems });
  };

  const handleSaveOrder = (itemToSave: UniformOrder) => {
    if (!firestore) return;

    if (!itemToSave.studentId || itemToSave.items.length === 0) {
        toast({
            variant: "destructive",
            title: "Campos Obrigatórios",
            description: "Por favor, selecione um Aluno e adicione pelo menos um item ao pedido."
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
                                onChange={(value) => handleStudentChange(order.id, value)}
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
                                onChange={e => updateOrder(order.id, { orderDate: e.target.value })} 
                            />
                        </div>
                    </div>
                     
                     <div className="space-y-4 mt-4 p-4 border rounded-lg bg-muted/30">
                        <h4 className="font-semibold text-sm">Itens do Pedido</h4>
                        {order.items.map((item) => (
                            <div key={item.id} className="grid grid-cols-[1fr,100px,100px,80px,auto] gap-2 items-center">
                                <Input value={item.name} onChange={e => handleItemChange(order.id, item.id, 'name', e.target.value)} placeholder="Nome do Item"/>
                                
                                <Select value={item.size} onValueChange={value => handleItemChange(order.id, item.id, 'size', value)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        {(UNIFORM_ITEMS.find(ui => ui.name === item.name)?.sizes || ['Único']).map(s => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Input type="number" value={item.price} onChange={e => handleItemChange(order.id, item.id, 'price', parseFloat(e.target.value) || 0)} placeholder="Preço"/>
                                
                                <Select value={String(item.quantity)} onValueChange={value => handleItemChange(order.id, item.id, 'quantity', parseInt(value, 10))}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        {[1,2,3,4,5].map(q => <SelectItem key={q} value={String(q)}>{q}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(order.id, item.id)}>
                                    <X className="h-4 w-4 text-destructive"/>
                                </Button>
                            </div>
                        ))}
                         <div className="flex gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm"><PlusCircle className="h-4 w-4 mr-2"/>Adicionar Item</Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0">
                                    <ScrollArea className="h-72">
                                        <div className="p-4">
                                        {UNIFORM_ITEMS.map(item => (
                                            <div key={item.name} className="text-sm p-2 rounded-md hover:bg-accent cursor-pointer" onClick={() => handleAddItem(order.id, item)}>
                                                {item.name}
                                            </div>
                                        ))}
                                        </div>
                                    </ScrollArea>
                                </PopoverContent>
                            </Popover>
                             <Button variant="outline" size="sm" onClick={() => handleAddCustomItem(order.id)}>Adicionar Item Personalizado</Button>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 items-end">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground">Valor Total (R$)</label>
                            <Input type="number" value={order.totalValue} disabled className="font-bold text-lg h-12"/>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground">Status do Pagamento</label>
                            <Select value={order.paymentStatus} onValueChange={(value) => updateOrder(order.id, { paymentStatus: value as 'Pago' | 'Pendente' })}>
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
                                onChange={e => updateOrder(order.id, { paymentDate: e.target.value })} 
                                disabled={order.paymentStatus !== 'Pago'}
                            />
                        </div>
                        <div className="flex items-center space-x-2 border rounded-md p-2 h-10">
                            <Switch 
                                id={`picked-up-${order.id}`} 
                                checked={order.materialPickedUp}
                                onCheckedChange={checked => updateOrder(order.id, { materialPickedUp: checked })}
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
