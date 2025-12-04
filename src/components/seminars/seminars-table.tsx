
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
import { Seminar, Student } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { useFirestore, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Combobox } from "../ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { differenceInYears } from "date-fns"

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
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Inscrições em Seminários</CardTitle>
          <CardDescription>
            Acompanhe as inscrições e pagamentos para os próximos seminários e cursos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Tema</TableHead>
                <TableHead className="w-[200px]">Aluno</TableHead>
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
              {!isLoading && seminars.map((seminar: Seminar) => (
                <TableRow key={seminar.id} className={seminar.isNew ? "bg-muted/50" : ""}>
                  <TableCell>
                    <Input placeholder="Tema do seminário" value={seminar.topic} onChange={e => handleInputChange(seminar.id, 'topic', e.target.value)} />
                  </TableCell>
                  <TableCell className="font-medium">
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
                      <div className="flex flex-col">
                        <span>{seminar.studentName}</span>
                        <Badge variant="secondary" className="w-fit">{seminar.studentBelt}</Badge>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select value={seminar.paymentStatus} onValueChange={(value) => handleInputChange(seminar.id, 'paymentStatus', value)}>
                      <SelectTrigger className="w-[100px]"><SelectValue placeholder="..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pago">Pago</SelectItem>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={seminar.paymentMethod} onValueChange={(value) => handleInputChange(seminar.id, 'paymentMethod', value)}>
                      <SelectTrigger className="w-[110px]"><SelectValue placeholder="..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Pix">Pix</SelectItem>
                        <SelectItem value="Cartão">Cartão</SelectItem>
                        <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                      <Input type="number" value={seminar.paymentAmount} onChange={e => handleInputChange(seminar.id, 'paymentAmount', parseFloat(e.target.value) || 0)} className="w-24" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
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
                  <TableCell colSpan={6} className="text-center py-10">
                    Nenhuma inscrição em seminário encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
  )
}
