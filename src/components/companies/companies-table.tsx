
"use client"

import { useState, useEffect } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Save, Trash2, Building2, Phone, Mail, User, MapPin, Calendar, CalendarPlus, Clock } from "lucide-react"
import { Company } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { useFirestore, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { Input } from "../ui/input"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CompaniesTableProps {
  companies: Company[]
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>
  isLoading: boolean
}

export function CompaniesTable({ companies, setCompanies, isLoading }: CompaniesTableProps) {
  const firestore = useFirestore()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleInputChange = (companyId: string, field: keyof Company, value: any) => {
    setCompanies(prev =>
      prev.map(item =>
        item.id === companyId ? { ...item, [field]: value } : item
      )
    )
  }

  const handleSaveCompany = (itemToSave: Company) => {
    if (!firestore) return

    if (!itemToSave.name || !itemToSave.workType) {
        toast({
            variant: "destructive",
            title: "Campos Obrigatórios",
            description: "O Nome da Empresa e o Tipo de Trabalho são obrigatórios."
        })
        return
    }

    const { isNew, id, ...itemData } = itemToSave
    const finalId = isNew ? doc(collection(firestore, "companies")).id : id

    const docRef = doc(firestore, 'companies', finalId)
    setDocumentNonBlocking(docRef, { ...itemData, id: finalId }, { merge: true })

    toast({
        title: "Empresa Salva!",
        description: `Os dados de ${itemData.name} foram salvos com sucesso.`
    })
    
    setCompanies(prev => prev.map(c => c.id === itemToSave.id ? { ...itemData, id: finalId, isNew: false } : c))
  }

  const handleDeleteCompany = (e: React.MouseEvent, itemId: string, companyName: string) => {
    e.stopPropagation()
    if (!firestore) return
    
    const isNewRow = itemId.startsWith('new_')
    if (isNewRow) {
        setCompanies(prev => prev.filter(c => c.id !== itemId))
        return
    }

    const docRef = doc(firestore, 'companies', itemId)
    deleteDocumentNonBlocking(docRef)
    toast({
        title: "Registro Removido",
        description: `A empresa ${companyName} foi removida do sistema.`
    })
  }

  const handleAddToCalendar = (company: Company) => {
    if (!company.eventDate) {
        toast({
            variant: "destructive",
            title: "Data não informada",
            description: "Preencha a data do evento para adicionar ao calendário."
        });
        return;
    }

    const dateStr = company.eventDate.replace(/-/g, '');
    let datesParam = "";

    if (company.eventTime) {
        const [hours, minutes] = company.eventTime.split(':');
        const startH = hours.padStart(2, '0');
        const startM = minutes.padStart(2, '0');
        
        // Duração padrão de 1 hora no mesmo dia
        let endHNum = parseInt(startH) + 1;
        
        if (endHNum >= 24) {
            // Se passar de 23h, definimos o final para o limite do dia (23:59)
            datesParam = `${dateStr}T${startH}${startM}00/${dateStr}T235959`;
        } else {
            const endH = endHNum.toString().padStart(2, '0');
            datesParam = `${dateStr}T${startH}${startM}00/${dateStr}T${endH}${startM}00`;
        }
    } else {
        // Evento de dia inteiro no mesmo dia
        datesParam = `${dateStr}/${dateStr}`;
    }

    const title = encodeURIComponent(`${company.workType}: ${company.name}`);
    const location = encodeURIComponent(company.address || '');
    const details = encodeURIComponent(`Contato: ${company.contactName || ''}\nNotas: ${company.notes || ''}`);
    
    const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesParam}&location=${location}&details=${details}`;
    
    window.open(calendarUrl, '_blank');
  };

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    if (status === 'Pago' || status === 'Palestra Gratuita' || status === 'Atividade Gratuita') return 'default';
    if (status === 'Pendente') return 'destructive';
    return 'outline';
  };

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
    <div className="w-full border rounded-lg overflow-hidden">
        {companies.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {companies.map((company: Company) => (
                <AccordionItem value={company.id} key={company.id} className={cn("px-4", company.isNew && "bg-muted/50")}>
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="grid grid-cols-[1fr_auto] sm:grid-cols-4 gap-2 w-full pr-4 items-center">
                          <div className="text-left font-medium flex items-center gap-2 truncate">
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="truncate">{company.name || "Novo Cliente Empresa"}</span>
                          </div>
                          <div className="hidden sm:block text-left text-muted-foreground truncate text-xs">
                              {company.workType}
                          </div>
                          <div className="text-left font-bold text-blue-600 text-sm sm:text-base">
                              R$ {company.value.toFixed(2)}
                          </div>
                          <div className="text-right sm:text-left">
                              <Badge variant={getStatusBadgeVariant(company.paymentStatus)} className="text-[10px] px-2 py-0">
                                {company.paymentStatus}
                              </Badge>
                          </div>
                      </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                              <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest border-b pb-1">Identificação e Local</h4>
                              <div className="space-y-2">
                                  <label className="text-sm font-medium">Nome da Empresa</label>
                                  <Input 
                                      placeholder="Ex: ACME Corporation" 
                                      value={company.name} 
                                      onChange={e => handleInputChange(company.id, 'name', e.target.value)} 
                                  />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">CNPJ</label>
                                    <Input 
                                        placeholder="00.000.000/0001-00" 
                                        value={company.cnpj || ''} 
                                        onChange={e => handleInputChange(company.id, 'cnpj', e.target.value)} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2"><Calendar className="h-3 w-3" /> Data do Evento</label>
                                    <Input 
                                        type="date"
                                        value={company.eventDate || ''} 
                                        onChange={e => handleInputChange(company.id, 'eventDate', e.target.value)} 
                                    />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2"><Clock className="h-3 w-3" /> Horário</label>
                                    <Input 
                                        type="time"
                                        value={company.eventTime || ''} 
                                        onChange={e => handleInputChange(company.id, 'eventTime', e.target.value)} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tipo de Trabalho</label>
                                    <Select value={company.workType} onValueChange={val => handleInputChange(company.id, 'workType', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Palestra">Palestra</SelectItem>
                                            <SelectItem value="Curso">Curso</SelectItem>
                                            <SelectItem value="Workshop">Workshop</SelectItem>
                                            <SelectItem value="Aula Particular">Aula Particular</SelectItem>
                                            <SelectItem value="Evento">Evento</SelectItem>
                                            <SelectItem value="Outros">Outros</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2"><MapPin className="h-3 w-3" /> Endereço do Evento</label>
                                <Input 
                                    placeholder="Rua, Número, Bairro, Cidade - UF" 
                                    value={company.address || ''} 
                                    onChange={e => handleInputChange(company.id, 'address', e.target.value)} 
                                />
                              </div>
                          </div>

                          <div className="space-y-4">
                              <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest border-b pb-1">Contato na Empresa</h4>
                              <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2"><User className="h-3 w-3" /> Nome do Contato</label>
                                <Input 
                                    placeholder="Ex: João Silva (RH)" 
                                    value={company.contactName || ''} 
                                    onChange={e => handleInputChange(company.id, 'contactName', e.target.value)} 
                                />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2"><Phone className="h-3 w-3" /> WhatsApp/Tel</label>
                                    <Input 
                                        placeholder="(11) 99999-9999" 
                                        value={company.contactPhone || ''} 
                                        onChange={e => handleInputChange(company.id, 'contactPhone', e.target.value)} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2"><Mail className="h-3 w-3" /> E-mail</label>
                                    <Input 
                                        type="email"
                                        placeholder="contato@empresa.com" 
                                        value={company.contactEmail || ''} 
                                        onChange={e => handleInputChange(company.id, 'contactEmail', e.target.value)} 
                                    />
                                </div>
                              </div>
                              <div className="pt-4">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                                    onClick={() => handleAddToCalendar(company)}
                                    disabled={!company.eventDate}
                                >
                                    <CalendarPlus className="h-4 w-4 mr-2" />
                                    Adicionar ao Google Agenda
                                </Button>
                              </div>
                          </div>
                      </div>

                      <div className="mt-8 space-y-4">
                          <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest border-b pb-1">Financeiro</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Valor do Contrato (R$)</label>
                                <Input 
                                    type="number"
                                    placeholder="0.00" 
                                    value={company.value} 
                                    onChange={e => handleInputChange(company.id, 'value', parseFloat(e.target.value) || 0)} 
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Status do Pagamento</label>
                                <Select value={company.paymentStatus} onValueChange={val => handleInputChange(company.id, 'paymentStatus', val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pago">Pago</SelectItem>
                                        <SelectItem value="Pendente">Pendente</SelectItem>
                                        <SelectItem value="Palestra Gratuita">Palestra Gratuita</SelectItem>
                                        <SelectItem value="Atividade Gratuita">Atividade Gratuita</SelectItem>
                                    </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Data do Pagamento</label>
                                <Input 
                                    type="date"
                                    value={company.paymentDate || ''} 
                                    onChange={e => handleInputChange(company.id, 'paymentDate', e.target.value)} 
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Forma de Recebimento</label>
                                <Select value={company.paymentMethod} onValueChange={val => handleInputChange(company.id, 'paymentMethod', val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pendente">Pendente</SelectItem>
                                        <SelectItem value="Pix">Pix</SelectItem>
                                        <SelectItem value="Boleto">Boleto</SelectItem>
                                        <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                        <SelectItem value="Palestra Gratuita">Palestra Gratuita</SelectItem>
                                        <SelectItem value="Atividade Gratuita">Atividade Gratuita</SelectItem>
                                    </SelectContent>
                                </Select>
                              </div>
                          </div>
                      </div>

                      <div className="space-y-2 mt-6">
                          <label className="text-sm font-medium">Anotações / Escopo do Trabalho</label>
                          <Textarea 
                              placeholder="Detalhes sobre le treinamento, local, observações extras..."
                              value={company.notes || ''}
                              onChange={e => handleInputChange(company.id, 'notes', e.target.value)} 
                          />
                      </div>

                      <div className="flex flex-col sm:flex-row justify-end items-center mt-8 gap-2 pt-4 border-t">
                          <Button variant="destructive" size="sm" className="w-full sm:w-auto" onClick={(e) => handleDeleteCompany(e, company.id, company.name)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                          </Button>
                          <Button size="sm" className="w-full sm:w-auto" onClick={() => handleSaveCompany(company)}>
                              <Save className="h-4 w-4 mr-2" />
                              Salvar Alterações
                          </Button>
                      </div>
                  </AccordionContent>
                </AccordionItem>
            ))}
          </Accordion>
        ) : (
            <div className="text-center py-10 text-muted-foreground">
              Nenhuma empresa cadastrada. Clique em "Novo Cliente Empresa" para iniciar.
            </div>
        )}
    </div>
  )
}
