
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
import { Trash2, MessageSquare, Save, CheckCircle2, Circle } from "lucide-react"
import { WomensMonthLead } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { useFirestore, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Input } from "../ui/input"
import { cn } from "@/lib/utils"
import { Checkbox } from "../ui/checkbox"

interface WomensMonthTableProps {
  leads: WomensMonthLead[];
  setLeads: React.Dispatch<React.SetStateAction<WomensMonthLead[]>>;
  isLoading: boolean;
}

export function WomensMonthTable({ leads, setLeads, isLoading }: WomensMonthTableProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleInputChange = (id: string, field: keyof WomensMonthLead, value: any) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleSave = (lead: WomensMonthLead) => {
    if (!firestore) return;
    if (!lead.name || !lead.whatsapp) {
      toast({
        variant: "destructive",
        title: "Campos Obrigatórios",
        description: "Preencha o nome e o WhatsApp antes de salvar."
      });
      return;
    }

    const { isNew, id, ...data } = lead;
    const finalId = isNew ? doc(collection(firestore, "womensMonth")).id : id;
    const docRef = doc(firestore, 'womensMonth', finalId);

    setDocumentNonBlocking(docRef, { ...data, id: finalId }, { merge: true });

    toast({
      title: "Registro Salvo!",
      description: `O cadastro de ${lead.name} foi atualizado.`
    });

    setLeads(prev => prev.map(l => l.id === lead.id ? { ...data, id: finalId, isNew: false } : l));
  };

  const handleDelete = (lead: WomensMonthLead) => {
    if (!firestore) return;
    if (lead.isNew) {
      setLeads(prev => prev.filter(l => l.id !== lead.id));
      return;
    }

    const docRef = doc(firestore, 'womensMonth', lead.id);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: "Registro Removido",
      description: `O cadastro de ${lead.name} foi excluído.`
    });
  };

  const handleToggleAttendance = (lead: WomensMonthLead) => {
    if (!firestore || lead.isNew) {
        handleInputChange(lead.id, 'attended', !lead.attended);
        return;
    }
    const newStatus = !lead.attended;
    handleInputChange(lead.id, 'attended', newStatus);
    const docRef = doc(firestore, 'womensMonth', lead.id);
    setDocumentNonBlocking(docRef, { attended: newStatus }, { merge: true });
  };

  const getWhatsAppLink = (lead: WomensMonthLead) => {
    const phone = lead.whatsapp.replace(/\D/g, '');
    const message = `Olá, ${lead.name.split(' ')[0]}! Tudo bem? 👋

Aqui é o Professor Thiago, do Centro de Krav Magá Ipiranga.

Vimos seu interesse na nossa campanha especial do Mês das Mulheres! 🛡️

Sua vaga para realizar um mês de aulas gratuitas durante o mês de março na turma de *${lead.chosenClass || 'iniciantes'}* está pré-reservada.

Gostaria de confirmar sua participação? Alguma dúvida sobre como funciona o treino ou localização?

Estamos ansiosos para te receber no tatame! 👊`;

    return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px] text-center">Compareceu?</TableHead>
          <TableHead className="min-w-[200px]">Nome da Interessada</TableHead>
          <TableHead className="min-w-[150px]">WhatsApp</TableHead>
          <TableHead className="min-w-[150px]">Turma Escolhida</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.id} className={cn(lead.isNew && "bg-muted/50")}>
            <TableCell className="text-center">
              <div className="flex justify-center">
                <Checkbox 
                    checked={lead.attended} 
                    onCheckedChange={() => handleToggleAttendance(lead)}
                    className="h-5 w-5"
                />
              </div>
            </TableCell>
            <TableCell>
              <Input
                value={lead.name}
                onChange={e => handleInputChange(lead.id, 'name', e.target.value)}
                placeholder="Nome Completo"
                className="h-8 border-transparent focus:border-input"
              />
            </TableCell>
            <TableCell>
              <Input
                value={lead.whatsapp}
                onChange={e => handleInputChange(lead.id, 'whatsapp', e.target.value)}
                placeholder="(11) 99999-9999"
                className="h-8 border-transparent focus:border-input"
              />
            </TableCell>
            <TableCell>
              <Input
                value={lead.chosenClass}
                onChange={e => handleInputChange(lead.id, 'chosenClass', e.target.value)}
                placeholder="Ex: Seg/Qua 20h"
                className="h-8 border-transparent focus:border-input"
              />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleSave(lead)}
                  className="h-8 w-8 text-blue-600 hover:text-blue-700"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <a href={getWhatsAppLink(lead)} target="_blank" rel="noopener noreferrer">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    disabled={!lead.whatsapp}
                    className="h-8 w-8 text-green-600 hover:text-green-700"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </a>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDelete(lead)}
                  className="h-8 w-8 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {leads.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
              Nenhuma interessada cadastrada para este ano.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
