"use client"

import { useState, useEffect } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Save, Trash2, UserCheck, UserX, CheckSquare, MessageSquare, ClipboardList } from "lucide-react"
import { Appointment } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { useFirestore, setDocumentNonBlocking, deleteDocumentNonBlocking, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { MessageTemplate } from "@/lib/types"
import { getTemplateBody, applyTemplateVars } from "@/lib/message-templates"
import { MESSAGE_TEMPLATE_IDS_BY_FEATURE } from "@/lib/message-templates"
import { MessageTemplatesWarning } from "@/components/message-templates-warning"
import { Input } from "../ui/input"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "../ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"
import { Badge } from "../ui/badge"
import { cn } from "@/lib/utils"
import { format, parseISO, isTomorrow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface AppointmentsTableProps {
  appointments: Appointment[]
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>
  isLoading: boolean
}

export function AppointmentsTable({ appointments, setAppointments, isLoading }: AppointmentsTableProps) {
  const firestore = useFirestore()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)

  const templatesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'messageTemplates');
  }, [firestore]);
  const { data: dbTemplates, isLoading: isLoadingTemplates } = useCollection<MessageTemplate>(templatesQuery);

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleInputChange = (appointmentId: string, field: keyof Appointment, value: any) => {
    setAppointments(prev =>
      prev.map(item =>
        item.id === appointmentId ? { ...item, [field]: value } : item
      )
    )
  }
  
  const handleStatusChange = (appointmentId: string, status: 'attended' | 'missed' | 'enrolled' | 'rescheduled') => {
      setAppointments(prev =>
        prev.map(item => {
          if (item.id === appointmentId) {
            return {
              ...item,
              attended: status === 'attended',
              missed: status === 'missed',
              enrolled: status === 'enrolled',
              rescheduled: status === 'rescheduled'
            }
          }
          return item
        })
      )
  }

  const getStatus = (item: Appointment) => {
    if (item.enrolled) return "Matriculado"
    if (item.attended) return "Compareceu"
    if (item.missed) return "Faltou"
    if (item.rescheduled) return "Reagendado"
    return "Agendado"
  }

  const getStatusVariant = (item: Appointment): "default" | "secondary" | "destructive" | "outline" => {
    if (item.enrolled) return "default"
    if (item.attended) return "secondary"
    if (item.missed) return "destructive"
    return "outline"
  }

  const handleSaveAppointment = (itemToSave: Appointment) => {
    if (!firestore) return

    if (!itemToSave.name || !itemToSave.whatsapp || !itemToSave.classDate || !itemToSave.classTime) {
        toast({
            variant: "destructive",
            title: "Campos Obrigatórios",
            description: "Por favor, preencha Nome, WhatsApp, Data e Horário antes de salvar."
        })
        return
    }

    const { isNew, id, ...itemData } = itemToSave
    const finalId = isNew ? doc(collection(firestore, "appointments")).id : id

    const docRef = doc(firestore, 'appointments', finalId)
    setDocumentNonBlocking(docRef, { ...itemData, id: finalId }, { merge: true })

    toast({
        title: "Agendamento Salvo!",
        description: `O agendamento de ${itemData.name} foi salvo com sucesso.`
    })
    
    setAppointments(prev => prev.map(ex => ex.id === itemToSave.id ? { ...itemData, id: finalId, isNew: false } : ex))
  }

  const handleDeleteAppointment = (e: React.MouseEvent, itemId: string, itemName: string) => {
    e.stopPropagation()
    if (!firestore) return
    
    const isNewRow = itemId.startsWith('new_')
    if (isNewRow) {
        setAppointments(prev => prev.filter(ex => ex.id !== itemId))
        return
    }

    const docRef = doc(firestore, 'appointments', itemId)
    deleteDocumentNonBlocking(docRef)
    toast({
        title: "Agendamento Removido",
        description: `O agendamento de ${itemName} foi removido.`
    })
  }

  const handleWhatsApp = (appointment: Appointment, templateId: string) => {
    if (isLoadingTemplates) return;
    const phone = appointment.whatsapp?.replace(/\D/g, '')
    if (!phone) return;
    const firstName = appointment.name.split(' ')[0]

    let vars: Record<string, string> = { nome: firstName };
    if (templateId === 'agendamentos_instrucoes') {
      if (!appointment.classDate) {
        toast({
          variant: "destructive",
          title: "Data da aula ausente",
          description: "Informe a data da aula antes de abrir a mensagem de instruções."
        });
        return;
      }
        try {
            const appointmentDate = parseISO(appointment.classDate)
            const dayOfWeek = format(appointmentDate, 'EEEE', { locale: ptBR })
            const formattedDate = format(appointmentDate, 'dd/MM/yyyy')
            vars = {
                nome_completo: appointment.name,
                nome: firstName,
                dia_semana: dayOfWeek,
                data_aula: formattedDate,
            };
        } catch {
          toast({
            variant: "destructive",
            title: "Data da aula inválida",
            description: "Verifique a data da aula antes de abrir a mensagem de instruções."
          });
          return;
        }
    }

    const templateBody = getTemplateBody(dbTemplates ?? [], templateId);
    if (!templateBody) {
      toast({
        variant: "destructive",
        title: "Modelo não disponível",
        description: `O modelo "${templateId}" não está configurado. Configure-o antes de enviar.`
      });
      return;
    }

    const message = applyTemplateVars(templateBody, vars);
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  if (isLoading || !mounted) {
      return (
          <div className="space-y-2 w-full">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
          </div>
      )
  }

  return (
    <>
        <MessageTemplatesWarning
          requiredIds={MESSAGE_TEMPLATE_IDS_BY_FEATURE.appointments}
          templates={dbTemplates}
          isLoading={isLoadingTemplates}
        />
    <div className="w-full border rounded-lg overflow-hidden">
        {appointments.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {appointments.map((appointment: Appointment) => {
              let classIsTomorrow = false
              if (appointment.classDate) {
                  try {
                      classIsTomorrow = isTomorrow(parseISO(appointment.classDate))
                  } catch (e) {}
              }

              return (
                <AccordionItem value={appointment.id} key={appointment.id} className={cn("px-4", appointment.isNew && "bg-muted/50")}>
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="grid grid-cols-[1fr_auto] sm:grid-cols-3 gap-2 w-full pr-4 items-center">
                          <div className="text-left font-medium flex items-center gap-2 truncate">
                            <span className="truncate">{appointment.name || "Novo Agendamento"}</span>
                            {classIsTomorrow && (
                                <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200 animate-pulse shrink-0">
                                    Amanhã
                                </Badge>
                            )}
                          </div>
                          <div className="hidden sm:block text-left text-muted-foreground truncate text-xs">
                              {appointment.classDate ? new Date(appointment.classDate + 'T00:00:00').toLocaleDateString('pt-BR') : '...'} às {appointment.classTime}
                          </div>
                          <div className="text-right sm:text-left">
                              <Badge variant={getStatusVariant(appointment)} className="text-[10px] px-2 py-0">
                                {getStatus(appointment)}
                              </Badge>
                          </div>
                      </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-2">
                              <label className="text-sm font-medium">Nome</label>
                              <Input 
                                  placeholder="Nome do interessado" 
                                  value={appointment.name} 
                                  onChange={e => handleInputChange(appointment.id, 'name', e.target.value)} 
                              />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">WhatsApp</label>
                              <Input 
                                  placeholder="(11) 99999-9999" 
                                  value={appointment.whatsapp} 
                                  onChange={e => handleInputChange(appointment.id, 'whatsapp', e.target.value)} 
                              />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
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
                            <label className="text-sm font-medium">Data da Aula</label>
                              <Input 
                                  type="date" 
                                  value={appointment.classDate} 
                                  onChange={e => handleInputChange(appointment.id, 'classDate', e.target.value)} 
                              />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Horário</label>
                              <Input 
                                  type="time" 
                                  value={appointment.classTime} 
                                  onChange={e => handleInputChange(appointment.id, 'classTime', e.target.value)} 
                              />
                          </div>
                      </div>

                      <div className="space-y-2 mt-4">
                          <label className="text-sm font-medium">Anotações / Feedback</label>
                          <Textarea 
                              placeholder="Observações sobre a aula experimental, interesse do aluno, etc."
                              value={appointment.notes || ''}
                              onChange={e => handleInputChange(appointment.id, 'notes', e.target.value)} 
                          />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t">
                          <span className="text-xs font-bold text-muted-foreground w-full mb-1 uppercase">Notificações WhatsApp</span>
                          <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50" disabled={!appointment.whatsapp || !appointment.classDate || isLoadingTemplates} onClick={() => handleWhatsApp(appointment, 'agendamentos_instrucoes')}>
                              <ClipboardList className="h-4 w-4 mr-2" />
                              Instruções
                          </Button>
                          <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50" disabled={!appointment.whatsapp || isLoadingTemplates} onClick={() => handleWhatsApp(appointment, 'agendamentos_faltou')}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Notificar Falta
                          </Button>
                          <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50" disabled={!appointment.whatsapp || isLoadingTemplates} onClick={() => handleWhatsApp(appointment, 'agendamentos_obrigado')}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Agradecer
                          </Button>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 gap-4">
                          <ToggleGroup type="single" size="sm" className="flex-wrap justify-start" value={getStatus(appointment)} onValueChange={(value) => { if(value) handleStatusChange(appointment.id, value as any)}}>
                              <ToggleGroupItem value="attended" className="text-[10px] px-2">
                                  Compareceu
                              </ToggleGroupItem>
                              <ToggleGroupItem value="missed" className="text-[10px] px-2">
                                  Faltou
                              </ToggleGroupItem>
                              <ToggleGroupItem value="rescheduled" className="text-[10px] px-2">
                                  Reagendado
                              </ToggleGroupItem>
                              <ToggleGroupItem value="enrolled" className="text-[10px] px-2">
                                  Matrícula
                              </ToggleGroupItem>
                          </ToggleGroup>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                              <Button variant="destructive" size="sm" className="flex-1 sm:flex-none" onClick={(e) => handleDeleteAppointment(e, appointment.id, appointment.name)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                              </Button>
                              <Button size="sm" className="flex-1 sm:flex-none" onClick={() => handleSaveAppointment(appointment)}>
                                  <Save className="h-4 w-4 mr-2" />
                                  Salvar
                              </Button>
                          </div>
                      </div>

                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        ) : (
            <div className="text-center py-10 text-muted-foreground">
              Nenhum agendamento encontrado. Clique em "Novo Agendamento" para adicionar um.
            </div>
        )}
    </div>
    </>
  )
}