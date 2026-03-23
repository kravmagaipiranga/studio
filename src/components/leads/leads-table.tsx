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
import { Trash2, MessageSquare, Save, CalendarPlus } from "lucide-react"
import { Lead } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { useFirestore, deleteDocumentNonBlocking, updateDocumentNonBlocking, addDocumentNonBlocking, setDocumentNonBlocking, useCollection, useMemoFirebase } from "@/firebase"
import { doc, collection } from "firebase/firestore"
import { MessageTemplate } from "@/lib/types"
import { DEFAULT_TEMPLATES, getTemplateBody, applyTemplateVars } from "@/lib/message-templates"
import { useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "../ui/checkbox"
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "../ui/input"
import { cn } from "@/lib/utils"

interface LeadsTableProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  isLoading: boolean;
  selectedLeads: string[];
  onToggleAll: () => void;
  onToggleOne: (leadId: string) => void;
}

export function LeadsTable({ 
    leads, 
    setLeads, 
    isLoading,
    selectedLeads,
    onToggleAll,
    onToggleOne,
}: LeadsTableProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const templatesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'messageTemplates');
  }, [firestore]);
  const { data: dbTemplates } = useCollection<MessageTemplate>(templatesQuery);
  const allTemplates = useMemo(() => {
    const list = [...(dbTemplates || [])];
    DEFAULT_TEMPLATES.forEach(def => { if (!list.find(t => t.id === def.id)) list.push(def); });
    return list;
  }, [dbTemplates]);

  const handleInputChange = (leadId: string, field: keyof Lead, value: string) => {
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === leadId ? { ...lead, [field]: value } : lead
      )
    );
  };

  const handleSave = (lead: Lead) => {
    if (!firestore) return;

    if (!lead.name || !lead.contactDate || !lead.phone) {
        toast({
            variant: "destructive",
            title: "Campos Obrigatórios",
            description: "Por favor, preencha Nome, Data e Telefone."
        });
        return;
    }

    const { isNew, id, ...leadData } = lead;
    const finalId = isNew ? doc(collection(firestore, "leads")).id : id;
    const docRef = doc(firestore, 'leads', finalId);

    setDocumentNonBlocking(docRef, { ...leadData, id: finalId }, { merge: true });

    toast({
      title: isNew ? "Lead Criado" : "Lead Atualizado",
      description: `O lead de ${leadData.name} foi salvo com sucesso.`
    });

    if (isNew) {
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...leadData, id: finalId, isNew: false } : l));
    }
  };

  const handleScheduleClass = async (lead: Lead) => {
    if (!firestore) return;
    
    const appointmentData = {
      name: lead.name,
      whatsapp: lead.phone,
      email: "",
      classDate: new Date().toISOString().split('T')[0],
      classTime: "19:00",
      notes: "Agendamento vindo do Lead CAT",
      enrolled: false,
      attended: false,
      missed: false,
      createdAt: new Date().toISOString(),
    };

    try {
      await addDocumentNonBlocking(collection(firestore, "appointments"), appointmentData);
      toast({
        title: "Agendamento Criado!",
        description: `O agendamento de ${lead.name} foi enviado para a lista de Agendamentos.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao agendar",
        description: "Não foi possível criar o agendamento.",
      });
    }
  };

  const handleDelete = (lead: Lead) => {
    if (!firestore) return;

    if (lead.isNew) {
        setLeads(prev => prev.filter(l => l.id !== lead.id));
        return;
    }

    const docRef = doc(firestore, 'leads', lead.id);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: "Lead Removido",
      description: `O lead de ${lead.name} foi removido.`
    })
  }

  const handleToggleContacted = (lead: Lead) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'leads', lead.id);
    const newStatus = !lead.contacted;
    updateDocumentNonBlocking(docRef, { contacted: newStatus });
  };
  
  const handleToggleResponded = (lead: Lead) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'leads', lead.id);
    const newStatus = !lead.responded;
    updateDocumentNonBlocking(docRef, { responded: newStatus });
  };

  const cleanPhoneNumber = (phone: string) => {
    if (typeof phone !== 'string') return '';
    return phone.replace(/\D/g, '');
  };
  
  const generateWhatsAppMessage = (leadName: string) => {
    const templateBody = getTemplateBody(allTemplates, 'leads_cat_cpkm');
    const message = applyTemplateVars(templateBody, { nome: leadName.split(' ')[0] });
    return encodeURIComponent(message);
  };

  const isAllSelected = leads.length > 0 && selectedLeads.length === leads.length;

  return (
    <Card className="w-full">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px] pl-4">
                    <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={onToggleAll}
                        aria-label="Selecionar todos"
                    />
                </TableHead>
                <TableHead className="w-[80px]">Contactado</TableHead>
                <TableHead className="w-[80px]">Respondeu</TableHead>
                <TableHead className="min-w-[250px]">Nome do Lead</TableHead>
                <TableHead className="min-w-[150px]">Data do Contato</TableHead>
                <TableHead className="min-w-[180px]">Telefone</TableHead>
                <TableHead className="text-right pr-4">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="pl-4"><Skeleton className="h-5 w-5" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell className="text-right pr-4"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && leads.map((lead: Lead) => {
                const whatsappNumber = cleanPhoneNumber(lead.phone);
                const message = generateWhatsAppMessage(lead.name);
                const whatsappLink = whatsappNumber.length >= 10 
                    ? `https://wa.me/${whatsappNumber.startsWith('55') ? whatsappNumber : '55' + whatsappNumber}?text=${message}` 
                    : '#';

                return (
                  <TableRow key={lead.id} data-state={selectedLeads.includes(lead.id) && "selected"} className={cn(lead.isNew && "bg-muted/50")}>
                    <TableCell className="pl-4">
                       <Checkbox
                            checked={selectedLeads.includes(lead.id)}
                            onCheckedChange={() => onToggleOne(lead.id)}
                            aria-label="Selecionar lead"
                        />
                    </TableCell>
                    <TableCell>
                       <Checkbox
                            checked={lead.contacted}
                            onCheckedChange={() => handleToggleContacted(lead)}
                            aria-label="Marcar como contactado"
                        />
                    </TableCell>
                    <TableCell>
                       <Checkbox
                            checked={!!lead.responded}
                            onCheckedChange={() => handleToggleResponded(lead)}
                            aria-label="Marcar como respondeu"
                        />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={lead.name}
                        onChange={(e) => handleInputChange(lead.id, 'name', e.target.value)}
                        placeholder="Nome do Lead"
                        className="h-auto p-1 border-0 bg-transparent rounded-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:bg-muted/50"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={lead.contactDate}
                        onChange={(e) => handleInputChange(lead.id, 'contactDate', e.target.value)}
                        className="h-auto p-1 border-0 bg-transparent rounded-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:bg-muted/50"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={lead.phone}
                        onChange={(e) => handleInputChange(lead.id, 'phone', e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="h-auto p-1 border-0 bg-transparent rounded-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:bg-muted/50"
                      />
                    </TableCell>
                    <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="hover:bg-transparent text-blue-600 hover:text-blue-700" 
                                onClick={() => handleScheduleClass(lead)}
                                title="Agendar Aula"
                                disabled={lead.isNew}
                            >
                                <CalendarPlus className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="hover:bg-transparent text-muted-foreground hover:text-foreground" onClick={() => handleSave(lead)}>
                                <Save className="h-4 w-4" />
                            </Button>
                            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                                <Button variant="secondary" size="sm" disabled={whatsappLink === '#' || lead.isNew} className="bg-green-500 text-white hover:bg-green-600">
                                    <MessageSquare className="h-4 w-4 mr-2"/>
                                    WhatsApp
                                </Button>
                            </a>
                            <Button variant="ghost" size="icon" className="hover:bg-transparent text-muted-foreground hover:text-destructive" onClick={() => handleDelete(lead)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {!isLoading && leads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Nenhum lead encontrado. Comece importando um arquivo ou adicionando manualmente.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
  )
}