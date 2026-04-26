"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

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

  const handleDeleteExam = (e: React.MouseEvent, examId: string, studentName: string) => {
    e.stopPropagation();
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
        {exams.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {exams.map((exam: Exam) => (
                <AccordionItem value={exam.id} key={exam.id} className={cn("px-4", exam.isNew && "bg-muted/50")}>
                    <AccordionTrigger className="hover:no-underline py-3 text-sm">
                        <div className="grid grid-cols-[1fr_auto] sm:grid-cols-4 gap-2 w-full pr-4 items-center">
                            <div className="text-left font-medium truncate flex items-center gap-2">
                                {beltEmojis[exam.targetBelt] && (
                                    <span
                                        className="text-base shrink-0"
                                        title={`Faixa alvo: ${exam.targetBelt}`}
                                        aria-label={`Faixa alvo: ${exam.targetBelt}`}
                                    >
                                        {beltEmojis[exam.targetBelt]}
                                    </span>
                                )}
                                <span className="truncate">{exam.studentName || "Novo Registro"}</span>
                            </div>
                            <div className="hidden sm:flex text-left text-muted-foreground items-center gap-2 truncate text-xs">
                                {beltEmojis[exam.targetBelt] && <span>{beltEmojis[exam.targetBelt]}</span>}
                                {exam.targetBelt || "Faixa..."}
                            </div>
                            <div className="text-left font-semibold text-blue-600">R$ {exam.paymentAmount.toFixed(2)}</div>
                            <div className="text-right sm:text-left">
                                <Badge variant={getStatusVariant(exam.paymentStatus)} className="text-[10px] px-2 py-0">{exam.paymentStatus}</Badge>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">Aluno</label>
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
                                <Input disabled value={exam.studentName} />
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">Data do Exame</label>
                                <Input type="date" value={exam.examDate} onChange={e => handleInputChange(exam.id, 'examDate', e.target.value)} />
                            </div>
                        </div>

                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                            <div className="space-y-2 sm:col-span-2">
                                <label className="text-xs font-semibold text-muted-foreground">Faixa Alvo</label>
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
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">Valor (R$)</label>
                                <Input type="number" value={exam.paymentAmount} onChange={e => handleInputChange(exam.id, 'paymentAmount', parseFloat(e.target.value) || 0)} />
                            </div>
                             <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">Pagamento</label>
                                <Select value={exam.paymentStatus} onValueChange={(value) => handleInputChange(exam.id, 'paymentStatus', value)}>
                                    <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                                    <SelectContent>
                                    <SelectItem value="Pago">Pago</SelectItem>
                                    <SelectItem value="Pendente">Pendente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                               <label className="text-xs font-semibold text-muted-foreground">Data do Pagamento</label>
                               <Input 
                                    type="date" 
                                    value={exam.paymentDate || ''} 
                                    onChange={e => handleInputChange(exam.id, 'paymentDate', e.target.value)} 
                                    disabled={exam.paymentStatus !== 'Pago'}
                                />
                            </div>
                             <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">Forma de Pagamento</label>
                                <Select value={exam.paymentMethod} onValueChange={(value) => handleInputChange(exam.id, 'paymentMethod', value)}>
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
                        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
                            <Button variant="destructive" size="sm" className="w-full sm:w-auto" onClick={(e) => handleDeleteExam(e, exam.id, exam.studentName)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                            </Button>
                            <Button size="sm" className="w-full sm:w-auto" onClick={() => handleSaveExam(exam)}>
                                <Save className="h-4 w-4 mr-2" />
                                Salvar
                            </Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
          </Accordion>
        ) : (
            <div className="text-center py-10 text-muted-foreground">
              Nenhuma inscrição de exame encontrada. Clique em "Agendar Exame" para adicionar uma.
            </div>
        )}
    </div>
  );
}