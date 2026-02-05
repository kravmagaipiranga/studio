
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
import { Trash2, MessageSquare } from "lucide-react"
import { Lead } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { useFirestore, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "../ui/checkbox"
import { format, parseISO } from "date-fns"
import { Card, CardContent } from "@/components/ui/card";

interface LeadsTableProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  isLoading: boolean;
}

export function LeadsTable({ leads, setLeads, isLoading }: LeadsTableProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDelete = (lead: Lead) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'leads', lead.id);
    deleteDocumentNonBlocking(docRef);
    setLeads(prev => prev.filter(l => l.id !== lead.id));
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
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, contacted: newStatus } : l));
  };

  const cleanPhoneNumber = (phone: string) => {
    return phone.replace(/\D/g, '');
  };

  return (
    <Card className="w-full">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px] pl-4">Status</TableHead>
                <TableHead>Nome do Lead</TableHead>
                <TableHead>Data do Contato</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="text-right pr-4">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="pl-4"><Skeleton className="h-5 w-5" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell className="text-right pr-4"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && leads.map((lead: Lead) => {
                const whatsappNumber = cleanPhoneNumber(lead.phone);
                // Basic check for Brazilian mobile numbers
                const whatsappLink = whatsappNumber.length >= 10 ? `https://wa.me/55${whatsappNumber}` : '#';

                return (
                  <TableRow key={lead.id}>
                    <TableCell className="pl-4">
                       <Checkbox
                            checked={lead.contacted}
                            onCheckedChange={() => handleToggleContacted(lead)}
                            aria-label="Marcar como contactado"
                        />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{lead.name}</div>
                    </TableCell>
                    <TableCell>
                      {format(parseISO(lead.contactDate), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      {lead.phone}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-2">
                            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm" disabled={whatsappLink === '#'}>
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
                  <TableCell colSpan={5} className="h-24 text-center">
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
