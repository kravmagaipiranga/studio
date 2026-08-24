
"use client"

import { useState } from "react";
import { collection, doc } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useFirestore, setDocumentNonBlocking } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Lead } from "@/lib/types";
import { Lightbulb } from "lucide-react";
import { format, isValid } from 'date-fns';

interface LeadImportDialogProps {
  children: React.ReactNode;
}

export function LeadImportDialog({ children }: LeadImportDialogProps) {
  const [pasteData, setPasteData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  // Imports always belong to the current year. The day/month from the
  // spreadsheet are preserved even when its year is wrong or outdated.
  const parseImportedContactDate = (rawValue: string): string => {
    const currentYear = new Date().getFullYear();
    const raw = rawValue.trim();
    let parsedDate: Date;

    if (!isNaN(Number(raw))) {
      // Excel serial date: parse its day/month, then replace the year.
      parsedDate = new Date(1900, 0, Number(raw) - 1);
    } else if (raw.includes('/')) {
      const parts = raw.split('/');
      const day = Number(parts[0]);
      const month = Number(parts[1]);
      parsedDate = new Date(currentYear, month - 1, day);
    } else {
      const parts = raw.split('-');
      if (parts.length >= 3) {
        // Supports YYYY-MM-DD and malformed YYYY values such as 0026-MM-DD.
        parsedDate = new Date(currentYear, Number(parts[1]) - 1, Number(parts[2]));
      } else {
        parsedDate = new Date(raw);
      }
    }

    if (!isValid(parsedDate)) return format(new Date(), 'yyyy-MM-dd');
    parsedDate.setFullYear(currentYear);
    return format(parsedDate, 'yyyy-MM-dd');
  };

  const handleBulkImport = () => {
    if (!firestore || !pasteData) {
      toast({
        variant: "destructive",
        title: "Nenhum dado para importar",
        description: "Por favor, cole os dados dos leads na área de texto.",
      });
      return;
    }

    setIsImporting(true);

    const lines = pasteData.trim().split('\n');
    let importedCount = 0;
    const promises: Promise<void>[] = [];

    lines.forEach(line => {
      const values = line.split('\t');
      if (values.length < 3 || !values[1]) return; // Skip lines without at least name and phone

      const [rawContactDate, name, phone] = values;
      
       let contactDate;
      try {
         contactDate = parseImportedContactDate(rawContactDate);
      } catch (e) {
        contactDate = format(new Date(), 'yyyy-MM-dd'); // Fallback
      }

      const newLeadId = doc(collection(firestore, "leads")).id;

      const leadData: Omit<Lead, 'isNew'> = {
        id: newLeadId,
        contactDate,
        name: name?.trim() || "Nome não informado",
        phone: phone?.trim().replace(/\D/g, '') || "", // Remove non-digits
        contacted: false,
        responded: false,
      };

      const docRef = doc(firestore, 'leads', newLeadId);
      promises.push(setDocumentNonBlocking(docRef, leadData, { merge: true }));
      importedCount++;
    });

    Promise.all(promises).then(() => {
        setIsImporting(false);
        setPasteData("");
        setIsOpen(false);
        toast({
            title: "Importação Concluída!",
            description: `${importedCount} leads foram importados com sucesso.`,
        });
    }).catch((err) => {
        setIsImporting(false);
        toast({
            variant: "destructive",
            title: "Erro na importação",
            description: "Ocorreu um erro ao salvar os leads. Tente novamente.",
        });
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Importação de Leads</DialogTitle>
          <DialogDescription>
            Copie e cole os dados de uma planilha (Excel, Google Sheets) para importar múltiplos leads.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
                <Lightbulb className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                    Certifique-se de que a ordem das colunas na sua planilha seja: <br/>
                    <code className="font-mono text-xs bg-muted p-0.5 rounded">Data do Contato (DD/MM/AAAA)</code>, <code className="font-mono text-xs bg-muted p-0.5 rounded">Nome</code>, <code className="font-mono text-xs bg-muted p-0.5 rounded">Telefone</code>.
                </p>
            </div>
            <Textarea
                placeholder="Cole as linhas da sua planilha aqui..."
                value={pasteData}
                onChange={(e) => setPasteData(e.target.value)}
                rows={10}
            />
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleBulkImport} disabled={isImporting || !pasteData}>
                {isImporting ? "Importando..." : "Importar Leads"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
