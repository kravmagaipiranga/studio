
"use client";

import { useState, useEffect } from "react";
import { collection, doc, query, orderBy } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { HandbookContent } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, BookOpen, Info, Copy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const BELTS = [
  { id: 'branca', name: 'Faixa Branca (Iniciante)', color: 'bg-slate-50 border-slate-200 text-slate-900' },
  { id: 'amarela', name: 'Faixa Amarela', color: 'bg-yellow-50 border-yellow-200 text-yellow-900' },
  { id: 'laranja', name: 'Faixa Laranja', color: 'bg-orange-50 border-orange-200 text-orange-900' },
  { id: 'verde', name: 'Faixa Verde', color: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
  { id: 'azul', name: 'Faixa Azul', color: 'bg-blue-50 border-blue-200 text-blue-900' },
  { id: 'marrom', name: 'Faixa Marrom', color: 'bg-amber-50 border-amber-200 text-amber-900' },
  { id: 'preta', name: 'Faixa Preta', color: 'bg-slate-100 border-slate-900 text-slate-900' },
];

export default function ApostilaPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [localContent, setLocalContent] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const handbookQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'handbook');
  }, [firestore]);

  const { data: dbContent, isLoading } = useCollection<HandbookContent>(handbookQuery);

  useEffect(() => {
    if (dbContent) {
      const contentMap: Record<string, string> = {};
      dbContent.forEach(item => {
        contentMap[item.id] = item.content;
      });
      setLocalContent(contentMap);
    }
  }, [dbContent]);

  const handleContentChange = (beltId: string, value: string) => {
    setLocalContent(prev => ({ ...prev, [beltId]: value }));
  };

  const handleSave = async (beltId: string, beltName: string) => {
    if (!firestore) return;
    
    setSavingId(beltId);
    try {
      const docRef = doc(firestore, 'handbook', beltId);
      const data: HandbookContent = {
        id: beltId,
        beltName,
        content: localContent[beltId] || "",
        updatedAt: new Date().toISOString()
      };
      
      await setDocumentNonBlocking(docRef, data, { merge: true });
      
      toast({
        title: "Matéria Atualizada",
        description: `A lista de exercícios da ${beltName} foi salva.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações."
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleCopyFromClipboard = async (beltId: string) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleContentChange(beltId, text);
        toast({ title: "Texto Colado", description: "O conteúdo da área de transferência foi inserido." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível acessar a área de transferência." });
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-emerald-600" />
            Apostila Técnica
          </h1>
          <p className="text-muted-foreground">Gestão de matérias e exercícios por graduação.</p>
        </div>
      </div>

      <Card className="bg-blue-50/50 border-blue-100">
        <CardContent className="p-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 leading-relaxed">
            Utilize os campos abaixo para organizar a matéria de cada faixa. Você pode <strong>copiar e colar</strong> listas inteiras de outros documentos. O conteúdo salvo aqui serve como base para o ensino e exames de graduação.
          </p>
        </CardContent>
      </Card>

      <Accordion type="multiple" className="w-full space-y-4">
        {BELTS.map((belt) => (
          <AccordionItem 
            key={belt.id} 
            value={belt.id} 
            className={cn("border rounded-xl px-4 overflow-hidden transition-all shadow-sm", belt.color)}
          >
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 rounded-full bg-current opacity-20" />
                <span className="text-lg font-black uppercase tracking-tight">{belt.name}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Lista de Exercícios / Matéria Técnica</label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[10px] font-bold uppercase"
                    onClick={() => handleCopyFromClipboard(belt.id)}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Colar da Área de Transferência
                  </Button>
                </div>
                
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <Textarea
                    placeholder="Cole aqui a lista de exercícios desta graduação..."
                    className="min-h-[300px] font-mono text-sm bg-white/80 border-current/10 focus-visible:ring-emerald-500 leading-relaxed"
                    value={localContent[belt.id] || ""}
                    onChange={(e) => handleContentChange(belt.id, e.target.value)}
                  />
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-current/10">
                  <Button 
                    onClick={() => handleSave(belt.id, belt.name)} 
                    disabled={savingId === belt.id}
                    className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                  >
                    {savingId === belt.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar Matéria
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
