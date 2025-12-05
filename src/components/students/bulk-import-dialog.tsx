
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
import { Student } from "@/lib/types";
import { Lightbulb } from "lucide-react";

interface BulkImportDialogProps {
  children: React.ReactNode;
}

export function BulkImportDialog({ children }: BulkImportDialogProps) {
  const [pasteData, setPasteData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleBulkImport = () => {
    if (!firestore || !pasteData) {
      toast({
        variant: "destructive",
        title: "Nenhum dado para importar",
        description: "Por favor, cole os dados dos alunos na área de texto.",
      });
      return;
    }

    setIsImporting(true);

    const lines = pasteData.trim().split('\n');
    let importedCount = 0;

    lines.forEach(line => {
      const values = line.split('\t');
      if (values.length < 1 || !values[0]) return; // Skip empty lines

      const [name, dob, cpf, phone, email, belt, status, startDate] = values;

      const newStudentId = doc(collection(firestore, "students")).id;

      const studentData: Partial<Student> = {
        id: newStudentId,
        name: name?.trim() || "Nome não informado",
        dob: dob?.trim() || "",
        cpf: cpf?.trim() || "",
        phone: phone?.trim() || "",
        email: email?.trim() || "",
        belt: (belt?.trim() as Student['belt']) || 'Branca',
        status: (status?.trim() as Student['status']) || 'Pendente',
        startDate: startDate?.trim() || "",
        registrationDate: new Date().toISOString(),
        paymentStatus: 'Pendente',
        planType: 'Mensal',
        planValue: 315,
      };

      const docRef = doc(firestore, 'students', newStudentId);
      setDocumentNonBlocking(docRef, studentData, { merge: true });
      importedCount++;
    });

    setIsImporting(false);
    setPasteData("");
    setIsOpen(false);

    toast({
      title: "Importação Concluída!",
      description: `${importedCount} alunos foram importados com sucesso.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Importação de Alunos em Massa</DialogTitle>
          <DialogDescription>
            Copie e cole várias linhas de uma planilha para cadastrar múltiplos alunos de uma vez.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
                <Lightbulb className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                    Certifique-se de que a ordem das colunas na sua planilha seja: <br/>
                    <code className="font-mono text-xs bg-muted p-0.5 rounded">Nome</code>, <code className="font-mono text-xs bg-muted p-0.5 rounded">Data Nasc.</code>, <code className="font-mono text-xs bg-muted p-0.5 rounded">CPF</code>, <code className="font-mono text-xs bg-muted p-0.5 rounded">Telefone</code>, <code className="font-mono text-xs bg-muted p-0.5 rounded">Email</code>, <code className="font-mono text-xs bg-muted p-0.5 rounded">Faixa</code>, <code className="font-mono text-xs bg-muted p-0.5 rounded">Status</code>, <code className="font-mono text-xs bg-muted p-0.5 rounded">Início</code>.
                </p>
            </div>
            <Textarea
                placeholder="Cole as linhas da sua planilha aqui. Cada aluno em uma nova linha..."
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
                {isImporting ? "Importando..." : "Importar Alunos"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
