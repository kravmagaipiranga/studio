
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
import { Seminar, Student } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { useFirestore, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Combobox } from "../ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { differenceInYears } from "date-fns"
import { Textarea } from "../ui/textarea"

interface SeminarsTableProps {
  seminars: Seminar[];
  setSeminars: React.Dispatch<React.SetStateAction<Seminar[]>>;
  allStudents: Student[];
  isLoading: boolean;
}

export function SeminarsTable({ seminars, setSeminars, allStudents, isLoading }: SeminarsTableProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const studentOptions = allStudents.slice().sort((a,b) => a.name.localeCompare(b.name)).map(s => ({ value: s.id, label: s.name }));

  const handleInputChange = (seminarId: string, field: keyof Seminar, value: any) => {
    setSeminars(prev =>
      prev.map(item => {
        if (item.id === seminarId) {
          const updatedItem = { ...item, [field]: value };

          if (field === 'studentId' && item.isNew) {
            const selectedStudent = allStudents.find(s => s.id === value);
            if (selectedStudent) {
              updatedItem.studentName = selectedStudent.name;
              updatedItem.studentBelt = selectedStudent.belt;
              updatedItem.studentCpf = selectedStudent.cpf;
              updatedItem.studentAge = selectedStudent.dob ? differenceInYears(new Date(), new Date(selectedStudent.dob)) : 0;
            }
          }
          return updatedItem;
        }
        return item;
      })
    );
  };
  
  const handleSaveSeminar = (itemToSave: Seminar) => {
    if (!firestore) return;
    
    if (!itemToSave.studentId || !itemToSave.topic) {
        toast({
            variant: "destructive",
            title: "Campos Obrigatórios",
            description: "Por favor, preencha o Tema e o Aluno antes de salvar."
        });
        return;
    }

    const { isNew, id, ...itemData } = itemToSave;
    const finalId = isNew ? doc(collection(firestore, "seminars")).id : id;

    const docRef = doc(firestore, 'seminars', finalId);
    setDocumentNonBlocking(docRef, { ...itemData, id: finalId }, { merge: true });

    toast({
        title: "Inscrição Salva!",
        description: `A inscrição de ${itemData.studentName} foi salva com sucesso.`
    });
    
    setSeminars(prev => prev.map(ex => ex.id === itemToSave.id ? { ...itemData, id: finalId, isNew: false } : ex));
  };

  const handleDeleteSeminar = (itemId: string, studentName: string) => {
    if (!firestore) return;
    
    const isNewRow = itemId.startsWith('new_');
    if (isNewRow) {
        setSeminars(prev => prev.filter(ex => ex.id !== itemId));
        return;
    }

    const docRef = doc(firestore, 'seminars', itemId);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Inscrição Removida",
        description: `A inscrição de ${studentName} foi removida.`
    })
  };

  return (
      <div className="w-full border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Detalhes da Inscrição</TableHead>
                <TableHead className="text-right w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({length: 3}).map((_, index) => (
                 <TableRow key={index}>
                    <TableCell colSpan={2}><Skeleton className="h-24 w-full" /></TableCell>
                 </TableRow>
              ))}
              {!isLoading && seminars.map((seminar: Seminar) => (
                <TableRow key={seminar.id} className={seminar.isNew ? "bg-muted/50" : ""}>
                    <TableCell className="p-4">
                        <div className="space-y-2 mb-4">
                           <label className="text-xs font-semibold text-muted-foreground">Tema do Seminário / Curso</label>
                           <Textarea placeholder="Ex: Defesa contra Ameaças com Faca" value={seminar.topic} onChange={e => handleInputChange(seminar.id, 'topic', e.target.value)} />
                        </div>
                        <div className="space-y-2 mb-4">
                            <label className="text-xs font-semibold text-muted-foreground">Aluno</label>
                            {seminar.isNew ? (
                              <Combobox
                                  options={studentOptions}
                                  value={seminar.studentId}
                                  onChange={(value) => handleInputChange(seminar.id, 'studentId', value)}
                                  placeholder="Selecione..."
                                  searchPlaceholder="Buscar aluno..."
                                  notFoundText="Nenhum aluno encontrado."
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <Input disabled value={seminar.studentName} />
                                <Badge variant="secondary" className="w-fit whitespace-nowrap">{seminar.studentBelt}</Badge>
                              </div>
                            )}
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">Valor (R$)</label>
                                <Input type="number" value={seminar.paymentAmount} onChange={e => handleInputChange(seminar.id, 'paymentAmount', parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">Status do Pagamento</label>
                                <Select value={seminar.paymentStatus} onValueChange={(value) => handleInputChange(seminar.id, 'paymentStatus', value)}>
                                  <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Pago">Pago</SelectItem>
                                    <SelectItem value="Pendente">Pendente</SelectItem>
                                  </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                               <label className="text-xs font-semibold text-muted-foreground">Forma de Pagamento</label>
                               <Select value={seminar.paymentMethod} onValueChange={(value) => handleInputChange(seminar.id, 'paymentMethod', value)}>
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
                    </TableCell>
                  <TableCell className="align-top text-right p-4">
                    <div className="flex flex-col items-center justify-start gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleSaveSeminar(seminar)}>
                            <Save className="h-4 w-4" />
                            <span className="sr-only">Salvar</span>
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteSeminar(seminar.id, seminar.studentName)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
               {!isLoading && seminars.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-10">
                    Nenhuma inscrição em seminário encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
      </div>
  )
}
