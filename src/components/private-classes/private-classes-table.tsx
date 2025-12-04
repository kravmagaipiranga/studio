
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
import { Save, Trash2 } from "lucide-react"
import { PrivateClass, Student } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { useFirestore, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Combobox } from "../ui/combobox";
import { useToast } from "@/hooks/use-toast";

interface PrivateClassesTableProps {
  privateClasses: PrivateClass[];
  setPrivateClasses: React.Dispatch<React.SetStateAction<PrivateClass[]>>;
  allStudents: Student[];
  isLoading: boolean;
}

export function PrivateClassesTable({ privateClasses, setPrivateClasses, allStudents, isLoading }: PrivateClassesTableProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const studentOptions = allStudents.slice().sort((a,b) => a.name.localeCompare(b.name)).map(s => ({ value: s.id, label: s.name }));

  const handleInputChange = (classId: string, field: keyof PrivateClass, value: any) => {
    setPrivateClasses(prev =>
      prev.map(item => {
        if (item.id === classId) {
          const updatedItem = { ...item, [field]: value };

          if (field === 'studentId' && item.isNew) {
            const selectedStudent = allStudents.find(s => s.id === value);
            if (selectedStudent) {
              updatedItem.studentName = selectedStudent.name;
              updatedItem.studentBelt = selectedStudent.belt;
            }
          }
          return updatedItem;
        }
        return item;
      })
    );
  };
  
  const handleSaveClass = (itemToSave: PrivateClass) => {
    if (!firestore) return;
    
    if (!itemToSave.studentId || !itemToSave.classDate) {
        toast({
            variant: "destructive",
            title: "Campos Obrigatórios",
            description: "Por favor, preencha Aluno e Data da Aula antes de salvar."
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Aulas Agendadas</CardTitle>
        <CardDescription>
          Acompanhe as aulas particulares agendadas e seus pagamentos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Aluno</TableHead>
              <TableHead>Data da Aula</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Forma Pgto.</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="text-right w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({length: 3}).map((_, index) => (
               <TableRow key={index}>
                  <TableCell><Skeleton className="h-9 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-9 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-9 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-9 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-9 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-9 w-full" /></TableCell>
               </TableRow>
            ))}
            {!isLoading && privateClasses.map((pc: PrivateClass) => (
              <TableRow key={pc.id} className={pc.isNew ? "bg-muted/50" : ""}>
                <TableCell className="font-medium">
                  {pc.isNew ? (
                    <Combobox
                        options={studentOptions}
                        value={pc.studentId}
                        onChange={(value) => handleInputChange(pc.id, 'studentId', value)}
                        placeholder="Selecione..."
                        searchPlaceholder="Buscar aluno..."
                        notFoundText="Nenhum aluno encontrado."
                    />
                  ) : (
                    <div className="flex flex-col">
                        <span>{pc.studentName}</span>
                        <Badge variant="secondary" className="w-fit">{pc.studentBelt}</Badge>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Input type="date" value={pc.classDate} onChange={e => handleInputChange(pc.id, 'classDate', e.target.value)} />
                </TableCell>
                <TableCell>
                  <Select value={pc.paymentStatus} onValueChange={(value) => handleInputChange(pc.id, 'paymentStatus', value)}>
                    <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pago">Pago</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={pc.paymentMethod} onValueChange={(value) => handleInputChange(pc.id, 'paymentMethod', value)}>
                    <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Pix">Pix</SelectItem>
                      <SelectItem value="Cartão">Cartão</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                    <Input type="number" value={pc.paymentAmount} onChange={e => handleInputChange(pc.id, 'paymentAmount', parseFloat(e.target.value) || 0)} className="w-24" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
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
                <TableCell colSpan={6} className="text-center py-10">
                  Nenhuma aula particular agendada. Clique em "Agendar Aula" para adicionar uma.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
