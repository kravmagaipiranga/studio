
"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Save, Trash2, UserCheck, UserX, CheckSquare, MessageSquare } from "lucide-react"
import { Appointment } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { useFirestore, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Input } from "../ui/input";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "../ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils"

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

  const handleDeleteAppointment = (e: React.MouseEvent, itemId: string, itemName: string) => {
    e.stopPropagation();
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

  const generateWhatsAppLinks = (appointment: Appointment) => {
    const phone = appointment.whatsapp?.replace(/\D/g, '');
    const firstName = appointment.name.split(' ')[0];
    
    const missedMessage = `Oi, ${firstName}, tudo bem? Notamos que você não conseguiu comparecer ao seu treino experimental na semana passada e sentimos sua falta!

Sabemos que a correria do dia a dia e os imprevistos podem desanimar, mas o Krav Magá é justamente sobre superar esses obstáculos e fortalecer sua mente. A disciplina é o que nos leva além, mesmo nos dias em que o cansaço tenta vencer. ✨

Que tal darmos esse primeiro passo juntos agora? Vamos agendar um novo horário para você vivenciar essa experiênica. Qual dia e horário desta semana funcionam melhor para você? 👊`;

    const thankYouMessage = `Olá, ${firstName}! Foi uma satisfação ter você conosco no nosso treino! 👊
Parabéns por dar esse primeiro passo. No Krav Magá, técnica e confiança andam juntas, e você já mostrou que tem a determinação necessária para se proteger e viver com mais segurança.

Queremos muito que você faça parte da nossa família aqui no CT Ipiranga! Para incentivar sua continuidade, temos um presente: 25% de desconto na sua camiseta oficial de treino (válido por 7 dias). Basta mostrar este print na recepção. 🎁

Pronto para o próximo nível? Faça sua matrícula no link abaixo:
👉 https://tinyurl.com/kmipiranga

Nos vemos no tatame!
Professor Thiago R. Pedro`;

    const baseUrl = "https://wa.me/55";
    return {
        missed: phone ? `${baseUrl}${phone}?text=${encodeURIComponent(missedMessage)}` : "#",
        thanks: phone ? `${baseUrl}${phone}?text=${encodeURIComponent(thankYouMessage)}` : "#"
    };
  };

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
        {appointments.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {appointments.map((appointment: Appointment) => {
              const waLinks = generateWhatsAppLinks(appointment);
              return (
                <AccordionItem value={appointment.id} key={appointment.id} className={cn("px-4", appointment.isNew && "bg-muted/50")}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full">
                          <div className="flex-1 text-left font-medium">{appointment.name || "Novo Agendamento"}</div>
                          <div className="flex-1 text-left text-muted-foreground">
                              {new Date(appointment.classDate + 'T00:00:00').toLocaleDateString('pt-BR')} às {appointment.classTime}
                          </div>
                          <div className="flex-1 text-left">
                              <Badge variant={getStatusVariant(appointment)}>{getStatus(appointment)}</Badge>
                          </div>
                      </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
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
                      </div>

                      <div className="space-y-2 mt-4">
                          <label className="text-xs font-semibold text-muted-foreground">Anotações / Feedback</label>
                          <Textarea 
                              placeholder="Observações sobre a aula experimental, interesse do aluno, etc."
                              value={appointment.notes || ''}
                              onChange={e => handleInputChange(appointment.id, 'notes', e.target.value)} 
                          />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t">
                          <span className="text-xs font-bold text-muted-foreground w-full mb-1">NOTIFICAÇÕES WHATSAPP</span>
                          <a href={waLinks.missed} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50" disabled={!appointment.whatsapp}>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Notificar Falta
                              </Button>
                          </a>
                          <a href={waLinks.thanks} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50" disabled={!appointment.whatsapp}>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Agradecer Presença
                              </Button>
                          </a>
                      </div>

                      <div className="flex justify-between items-center mt-6">
                          <ToggleGroup type="single" size="sm" value={getStatus(appointment)} onValueChange={(value) => { if(value) handleStatusChange(appointment.id, value as any)}}>
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
                          <div className="flex items-center gap-2">
                              <Button variant="destructive" onClick={(e) => handleDeleteAppointment(e, appointment.id, appointment.name)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                              </Button>
                              <Button onClick={() => handleSaveAppointment(appointment)}>
                                  <Save className="h-4 w-4 mr-2" />
                                  Salvar Agendamento
                              </Button>
                          </div>
                      </div>

                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
            <div className="text-center py-10 text-muted-foreground">
              Nenhum agendamento encontrado. Clique em "Novo Agendamento" para adicionar um.
            </div>
        )}
    </div>
  )
}
