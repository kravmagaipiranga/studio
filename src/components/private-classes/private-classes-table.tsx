
"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Save, Trash2 } from "lucide-react"
import { PrivateClass } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { useFirestore, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "../ui/textarea";

interface PrivateClassesTableProps {
  privateClasses: PrivateClass[];
  setPrivateClasses: React.Dispatch<React.SetStateAction<PrivateClass[]>>;
  isLoading: boolean;
}

export function PrivateClassesTable({ privateClasses, setPrivateClasses, isLoading }: PrivateClassesTableProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const handleInputChange = (classId: string, field: keyof PrivateClass, value: any) => {
    setPrivateClasses(prev =>
      prev.map(item => {
        if (item.id === classId) {
          const updatedItem = { ...item, [field]: value };

          // Recalculate total amount if number of classes or price per class changes
          if (field === 'numberOfClasses' || field === 'pricePerClass') {
              const numClasses = field === 'numberOfClasses' ? (Number(value) || 0) : item.numberOfClasses;
              const price = field === 'pricePerClass' ? (Number(value) || 0) : item.pricePerClass;
              updatedItem.paymentAmount = numClasses * price;
          }
          return updatedItem;
        }
        return item;
      })
    );
  };
  
  const handleSaveClass = (itemToSave: PrivateClass) => {
    if (!firestore) return;
    
    if (!itemToSave.studentName || !itemToSave.classDate) {
        toast({
            variant: "destructive",
            title: "Campos Obrigatórios",
            description: "Por favor, preencha Nome do Aluno e Data da Aula antes de salvar."
        });
        return;
    }

    const { isNew, id, ...itemData } = itemToSave;
    const finalId = isNew ? doc(collection(firestore, "privateClasses")).id : id;

    const docRef = doc(firestore, 'privateClasses', finalId);
    setDocumentNonBlocking(docRef, { ...itemData, id: finalId }, { merge: true });

    toast({
        title: "Aula Salva!",
        description: `A aula de ${itemData.studentName} foi salva com sucesso.`
    });
    
    setPrivateClasses(prev => prev.map(ex => ex.id === itemToSave.id ? { ...itemData, id: finalId, isNew: false } : ex));
  };

  const handleDeleteClass = (itemId: string, studentName: string) => {
    if (!firestore) return;
    
    const isNewRow = itemId.startsWith('new_');
    if (isNewRow) {
        setPrivateClasses(prev => prev.filter(ex => ex.id !== itemId));
        return;
    }

    const docRef = doc(firestore, 'privateClasses', itemId);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Aula Removida",
        description: `A aula de ${studentName} foi removida.`
    })
  };

  return (
    <div className="w-full border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Detalhes da Aula</TableHead>
            <TableHead className="text-right w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && Array.from({length: 3}).map((_, index) => (
             <TableRow key={index}>
                <TableCell colSpan={2}><Skeleton className="h-24 w-full" /></TableCell>
             </TableRow>
          ))}
          {!isLoading && privateClasses.map((pc: PrivateClass) => (
            <TableRow key={pc.id} className={pc.isNew ? "bg-muted/50" : ""}>
              <TableCell className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-xs font-semibold text-muted-foreground">Aluno</label>
                       <Input 
                          placeholder="Nome do Aluno"
                          value={pc.studentName} 
                          onChange={e => handleInputChange(pc.id, 'studentName', e.target.value)} 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">Data da Aula</label>
                        <Input type="date" value={pc.classDate} onChange={e => handleInputChange(pc.id, 'classDate', e.target.value)} />
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">Qtd Aulas</label>
                        <Input type="number" value={pc.numberOfClasses} onChange={e => handleInputChange(pc.id, 'numberOfClasses', parseInt(e.target.value, 10))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">Valor/Aula (R$)</label>
                        <Input type="number" value={pc.pricePerClass} onChange={e => handleInputChange(pc.id, 'pricePerClass', parseFloat(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">Valor Total (R$)</label>
                        <Input type="number" value={pc.paymentAmount} disabled className="font-bold" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                       <label className="text-xs font-semibold text-muted-foreground">Status do Pagamento</label>
                       <Select value={pc.paymentStatus} onValueChange={(value) => handleInputChange(pc.id, 'paymentStatus', value)}>
                          <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pago">Pago</SelectItem>
                            <SelectItem value="Pendente">Pendente</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                       <label className="text-xs font-semibold text-muted-foreground">Forma de Pagamento</label>
                       <Select value={pc.paymentMethod} onValueChange={(value) => handleInputChange(pc.id, 'paymentMethod', value)}>
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
                <div className="space-y-2 mt-4">
                    <label className="text-xs font-semibold text-muted-foreground">Anotações Gerais</label>
                    <Textarea 
                        placeholder="Observações sobre a aula ou o aluno..."
                        value={pc.notes || ""} 
                        onChange={e => handleInputChange(pc.id, 'notes', e.target.value)}
                    />
                </div>
              </TableCell>
              <TableCell className="align-top text-right p-4">
                 <div className="flex flex-col items-center justify-start gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleSaveClass(pc)}>
                        <Save className="h-4 w-4" />
                        <span className="sr-only">Salvar</span>
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteClass(pc.id, pc.studentName)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                    </Button>
                  </div>
              </TableCell>
            </TableRow>
          ))}
           {!isLoading && privateClasses.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="text-center py-10">
                Nenhuma aula particular agendada. Clique em "Agendar Aula" para adicionar uma.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
