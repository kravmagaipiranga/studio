
"use client"

import { useState, useEffect } from "react";
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
import { Save, Trash2 } from "lucide-react"
import { Exam, Student } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { useFirestore, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Combobox } from "../ui/combobox";
import { differenceInYears } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ExamsTableProps {
  exams: Exam[];
  setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  allStudents: Student[];
  isLoading: boolean;
}

const beltEmojis: Record<string, string> = {
    'Amarela': '🟡',
    'Laranja': '🟠',
    'Verde': '🟢',
    'Azul': '🔵',
    'Marrom': '🟤',
    'Preta': '⚫',
};

export function ExamsTable({ exams, setExams, allStudents, isLoading }: ExamsTableProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const studentOptions = allStudents.slice().sort((a,b) => a.name.localeCompare(b.name)).map(s => ({ value: s.id, label: s.name }));

  const handleInputChange = (examId: string, field: keyof Exam, value: any) => {
    setExams(prevExams =>
      prevExams.map(exam => {
        if (exam.id === examId) {
          const updatedExam = { ...exam, [field]: value };

          // If a new student is selected for a new row, populate their data
          if (field === 'studentId' && exam.isNew) {
            const selectedStudent = allStudents.find(s => s.id === value);
            if (selectedStudent) {
              updatedExam.studentName = selectedStudent.name;
              updatedExam.studentCpf = selectedStudent.cpf;
              updatedExam.studentAge = selectedStudent.dob ? differenceInYears(new Date(), new Date(selectedStudent.dob)) : 0;
            }
          }
          return updatedExam;
        }
        return exam;
      })
    );
  };
  
  const handleSaveExam = (examToSave: Exam) => {
    if (!firestore) return;
    
    // Validate required fields before saving
    if (!examToSave.studentId || !examToSave.examDate || !examToSave.targetBelt) {
        toast({
            variant: "destructive",
            title: "Campos Obrigatórios",
            description: "Por favor, preencha Aluno, Data do Exame e Faixa antes de salvar."
        });
        return;
    }

    const { isNew, id, ...examData } = examToSave;
    const finalId = isNew ? doc(collection(firestore, "exams")).id : id;

    const docRef = doc(firestore, 'exams', finalId);
    setDocumentNonBlocking(docRef, { ...examData, id: finalId }, { merge: true });

    toast({
        title: "Exame Salvo!",
        description: `A inscrição de ${examData.studentName} foi salva com sucesso.`
    });
    
    // Update local state to remove the 'isNew' flag and set the final ID
    setExams(prev => prev.map(ex => ex.id === examToSave.id ? { ...examData, id: finalId, isNew: false } : ex));
  };

  const handleDeleteExam = (examId: string, studentName: string) => {
    if (!firestore) return;
    
    const isNewRow = examId.startsWith('new_');
    if (isNewRow) {
        setExams(prev => prev.filter(ex => ex.id !== examId));
        return;
    }

    const docRef = doc(firestore, 'exams', examId);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Inscrição Removida",
        description: `A inscrição de ${studentName} foi removida.`
    })
  };


  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Inscrições de Exame</CardTitle>
        <CardDescription>
          Acompanhe e edite as inscrições para os próximos exames de faixa. As linhas são ordenadas por faixa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Aluno</TableHead>
              <TableHead>Data Exame</TableHead>
              <TableHead>Faixa</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Pgto.</TableHead>
              <TableHead>Data Pgto.</TableHead>
              <TableHead>Método</TableHead>
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
                <TableCell><Skeleton className="h-9 w-full" /></TableCell>
                <TableCell><Skeleton className="h-9 w-full" /></TableCell>
              </TableRow>
            ))}
            {!isLoading && exams.map((exam) => (
              <TableRow key={exam.id} className={exam.isNew ? "bg-muted/50" : ""}>
                <TableCell className="font-medium">
                  {exam.isNew ? (
                    <Combobox
                        options={studentOptions}
                        value={exam.studentId}
                        onChange={(value) => handleInputChange(exam.id, 'studentId', value)}
                        placeholder="Selecione..."
                        searchPlaceholder="Buscar aluno..."
                        notFoundText="Nenhum aluno encontrado."
                    />
                  ) : (
                    exam.studentName
                  )}
                </TableCell>
                <TableCell>
                  <Input type="date" value={exam.examDate} onChange={e => handleInputChange(exam.id, 'examDate', e.target.value)} />
                </TableCell>
                <TableCell>
                   <Select value={exam.targetBelt} onValueChange={(value) => handleInputChange(exam.id, 'targetBelt', value)}>
                      <SelectTrigger>
                        <SelectValue>
                           <div className="flex items-center gap-2">
                                {beltEmojis[exam.targetBelt] && <span>{beltEmojis[exam.targetBelt]}</span>}
                                {exam.targetBelt || "Faixa..."}
                           </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Amarela">🟡 Amarela</SelectItem>
                        <SelectItem value="Laranja">🟠 Laranja</SelectItem>
                        <SelectItem value="Verde">🟢 Verde</SelectItem>
                        <SelectItem value="Azul">🔵 Azul</SelectItem>
                        <SelectItem value="Marrom">🟤 Marrom</SelectItem>
                        <SelectItem value="Preta">⚫ Preta</SelectItem>
                      </SelectContent>
                   </Select>
                </TableCell>
                <TableCell>
                    <Input type="number" value={exam.paymentAmount} onChange={e => handleInputChange(exam.id, 'paymentAmount', parseFloat(e.target.value) || 0)} className="w-24" />
                </TableCell>
                <TableCell>
                  <Select value={exam.paymentStatus} onValueChange={(value) => handleInputChange(exam.id, 'paymentStatus', value)}>
                    <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pago">Pago</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                 <TableCell>
                    <Input 
                        type="date" 
                        value={exam.paymentDate || ''} 
                        onChange={e => handleInputChange(exam.id, 'paymentDate', e.target.value)} 
                        disabled={exam.paymentStatus !== 'Pago'}
                    />
                </TableCell>
                <TableCell>
                  <Select value={exam.paymentMethod} onValueChange={(value) => handleInputChange(exam.id, 'paymentMethod', value)}>
                    <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Pix">Pix</SelectItem>
                      <SelectItem value="Cartão">Cartão</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleSaveExam(exam)}>
                        <Save className="h-4 w-4" />
                        <span className="sr-only">Salvar</span>
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteExam(exam.id, exam.studentName)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
             {!isLoading && exams.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10">
                  Nenhuma inscrição de exame encontrada. Clique em "Agendar Exame" para adicionar uma.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
