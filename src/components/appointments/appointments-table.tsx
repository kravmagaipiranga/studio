
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
import { Save, Trash2, UserCheck, UserX, CheckSquare } from "lucide-react"
import { Appointment } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { useFirestore, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Input } from "../ui/input";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "../ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { Badge } from "../ui/badge";

interface AppointmentsTableProps {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  isLoading: boolean;
}

export function AppointmentsTable({ appointments, setAppointments, isLoading }: AppointmentsTableProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleInputChange = (appointmentId: string, field: keyof Appointment, value: any) => {
    setAppointments(prev =>
      prev.map(item =>
        item.id === appointmentId ? { ...item, [field]: value } : item
      )
    );
  };
  
  const handleStatusChange = (appointmentId: string, status: 'attended' | 'missed' | 'enrolled') => {
      setAppointments(prev =>
        prev.map(item => {
          if (item.id === appointmentId) {
            return {
              ...item,
              attended: status === 'attended',
              missed: status === 'missed',
              enrolled: status === 'enrolled'
            };
          }
          return item;
        })
      );
  };

  const getStatus = (item: Appointment) => {
    if (item.enrolled) return "Matriculado";
    if (item.attended) return "Compareceu";
    if (item.missed) return "Faltou";
    return "Agendado";
  }

  const getStatusVariant = (item: Appointment): "default" | "secondary" | "destructive" | "outline" => {
    if (item.enrolled) return "default";
    if (item.attended) return "secondary";
    if (item.missed) return "destructive";
    return "outline";
  }

  const handleSaveAppointment = (itemToSave: Appointment) => {
    if (!firestore) return;

    if (!itemToSave.name || !itemToSave.whatsapp || !itemToSave.classDate || !itemToSave.classTime) {
        toast({
            variant: "destructive",
            title: "Campos Obrigatórios",
            description: "Por favor, preencha Nome, WhatsApp, Data e Horário antes de salvar."
        });
        return;
    }

    const { isNew, id, ...itemData } = itemToSave;
    const finalId = isNew ? doc(collection(firestore, "appointments")).id : id;

    const docRef = doc(firestore, 'appointments', finalId);
    setDocumentNonBlocking(docRef, { ...itemData, id: finalId }, { merge: true });

    toast({
        title: "Agendamento Salvo!",
        description: `O agendamento de ${itemData.name} foi salvo com sucesso.`
    });
    
    setAppointments(prev => prev.map(ex => ex.id === itemToSave.id ? { ...itemData, id: finalId, isNew: false } : ex));
  };

  const handleDeleteAppointment = (itemId: string, itemName: string) => {
    if (!firestore) return;
    
    const isNewRow = itemId.startsWith('new_');
    if (isNewRow) {
        setAppointments(prev => prev.filter(ex => ex.id !== itemId));
        return;
    }

    const docRef = doc(firestore, 'appointments', itemId);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Agendamento Removido",
        description: `O agendamento de ${itemName} foi removido.`
    })
  };

  return (
    <div className="w-full border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Detalhes do Agendamento</TableHead>
              <TableHead className="text-right w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({length: 3}).map((_, index) => (
               <TableRow key={index}>
                <TableCell colSpan={2}><Skeleton className="h-48 w-full" /></TableCell>
              </TableRow>
            ))}
            {!isLoading && appointments.map((appointment: Appointment) => (
              <TableRow key={appointment.id} className={appointment.isNew ? "bg-muted/50" : ""}>
                <TableCell className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground">Nome</label>
                            <Input 
                                placeholder="Nome do interessado" 
                                value={appointment.name} 
                                onChange={e => handleInputChange(appointment.id, 'name', e.target.value)} 
                            />
                        </div>
                         <div className="space-y-2">
                           <label className="text-xs font-semibold text-muted-foreground">WhatsApp</label>
                            <Input 
                                placeholder="(11) 99999-9999" 
                                value={appointment.whatsapp} 
                                onChange={e => handleInputChange(appointment.id, 'whatsapp', e.target.value)} 
                            />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-semibold text-muted-foreground">Email</label>
                            <Input 
                                type="email" 
                                placeholder="email@exemplo.com" 
                                value={appointment.email || ''} 
                                onChange={e => handleInputChange(appointment.id, 'email', e.target.value)} 
                            />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 items-end">
                        <div className="space-y-2">
                           <label className="text-xs font-semibold text-muted-foreground">Data da Aula</label>
                            <Input 
                                type="date" 
                                value={appointment.classDate} 
                                onChange={e => handleInputChange(appointment.id, 'classDate', e.target.value)} 
                            />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-semibold text-muted-foreground">Horário</label>
                            <Input 
                                type="time" 
                                value={appointment.classTime} 
                                onChange={e => handleInputChange(appointment.id, 'classTime', e.target.value)} 
                            />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-semibold text-muted-foreground">Status</label>
                           <div className="flex items-center h-10">
                                <Badge variant={getStatusVariant(appointment)}>{getStatus(appointment)}</Badge>
                           </div>
                        </div>
                    </div>

                    <div className="space-y-2 mt-4">
                        <label className="text-xs font-semibold text-muted-foreground">Anotações / Feedback</label>
                        <Textarea 
                            placeholder="Observações sobre a aula experimental, interesse do aluno, etc."
                            value={appointment.notes || ''}
                            onChange={e => handleInputChange(appointment.id, 'notes', e.target.value)} 
                        />
                    </div>
                    <div className="mt-4">
                        <ToggleGroup type="single" size="sm" onValueChange={(value) => { if(value) handleStatusChange(appointment.id, value as any)}}>
                            <ToggleGroupItem value="attended" aria-label="Marcar como compareceu">
                                <UserCheck className="h-4 w-4 mr-2"/>
                                Compareceu
                            </ToggleGroupItem>
                            <ToggleGroupItem value="missed" aria-label="Marcar como faltou">
                                <UserX className="h-4 w-4 mr-2"/>
                                Faltou
                            </ToggleGroupItem>
                            <ToggleGroupItem value="enrolled" aria-label="Marcar como matriculado">
                                <CheckSquare className="h-4 w-4 mr-2"/>
                                Fez Matrícula
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>

                </TableCell>
                <TableCell className="align-top text-right p-4">
                  <div className="flex flex-col items-center justify-start gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleSaveAppointment(appointment)}>
                        <Save className="h-4 w-4" />
                        <span className="sr-only">Salvar</span>
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteAppointment(appointment.id, appointment.name)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && appointments.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-10">
                  Nenhum agendamento encontrado. Clique em "Novo Agendamento" para adicionar um.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
    </div>
  )
}
