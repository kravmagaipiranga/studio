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
import { Trash2, MessageSquare, Save } from "lucide-react"
import { Lead } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { useFirestore, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { doc } from "firebase/firestore"
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
    return phone.replace(/\D/g, '');
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
                <TableHead>Data do Contato</TableHead>
                <TableHead>Telefone</TableHead>
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
                const whatsappLink = whatsappNumber.length >= 10 ? `https://wa.me/55${whatsappNumber}` : '#';

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
                            <Button variant="ghost" size="icon" onClick={() => handleSave(lead)}>
                                <Save className="h-4 w-4" />
                            </Button>
                            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                                <Button variant="secondary" size="sm" disabled={whatsappLink === '#'}>
                                    <MessageSquare className="h-4 w-4 mr-2"/>
                                    WhatsApp
                                </Button>
                            </a>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(lead)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
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
