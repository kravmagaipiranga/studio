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
import { useFirestore, deleteDocumentNonBlocking, updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase"
import { doc, collection } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "../ui/checkbox"
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "../ui/input"

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

  const handleInputChange = (leadId: string, field: keyof Lead, value: string) => {
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === leadId ? { ...lead, [field]: value } : lead
      )
    );
  };

  const handleSave = (lead: Lead) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'leads', lead.id);
    updateDocumentNonBlocking(docRef, {
        name: lead.name,
        contactDate: lead.contactDate,
        phone: lead.phone,
    });
    toast({
      title: "Lead Atualizado",
      description: `O lead de ${lead.name} foi atualizado.`
    });
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
    const message = `Olá, ${leadName}! Tudo bem? 👋

Aqui é o Professor Thiago, do Centro de Krav Magá Ipiranga.

Recentemente, você entrou em contato com a Central de Atendimento para saber mais sobre nossa academia. Gostaria de te convidar para sentir na pele a segurança e a confiança que o Krav Magá proporciona através de uma aula experimental gratuita. 🛡️

Você sabia que o Centro de Treinamento Krav Magá Ipiranga foi oficialmente premiado com o título "Self Defence School of the Year 2025 – South East Brazil", no GHP Active Lifestyle Awards 2025?

O prêmio reconhece instituições que se destacam na promoção de saúde, bem-estar, estilo de vida ativo e segurança pessoal, avaliando critérios como impacto social, qualidade dos serviços, compromisso com os alunos, profissionalismo e contribuição para o desenvolvimento da comunidade.

Com mais de 27 anos de experiência, somos o maior CT da região e estamos prontos para te ajudar a descobrir sua força.

Horários disponíveis para iniciantes:
🔹 Seg/Qua: 18h e 20h
🔹 Ter/Qui: 19h e 20h
🔹 Sáb: 10h30

Podemos reservar sua vaga para esta semana?

Basta responder por aqui ou clicar no link: 🔗 https://form.jotform.com/kravmagaipiranga/agende

Qualquer dúvida, estou à disposição! 👊

Professor Thiago
kravmagaipiranga.com`;

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
                  <TableRow key={lead.id} data-state={selectedLeads.includes(lead.id) && "selected"}>
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
                            >
                                <CalendarPlus className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="hover:bg-transparent text-muted-foreground hover:text-foreground" onClick={() => handleSave(lead)}>
                                <Save className="h-4 w-4" />
                            </Button>
                            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                                <Button variant="secondary" size="sm" disabled={whatsappLink === '#'} className="bg-green-500 text-white hover:bg-green-600">
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
                    Nenhum lead encontrado. Comece importando um arquivo.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
  )
}
