
"use client";

import { useState, useMemo } from "react";
import { collection } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { HandbookContent } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { BookOpen, Info, ShieldCheck, ChevronRight, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const BELTS = [
  { id: 'branca', name: 'Faixa Branca (Iniciante)', color: 'border-slate-200 bg-slate-50 text-slate-900', iconColor: 'text-slate-400' },
  { id: 'amarela', name: 'Faixa Amarela', color: 'border-yellow-200 bg-yellow-50 text-yellow-900', iconColor: 'text-yellow-500' },
  { id: 'laranja', name: 'Faixa Laranja', color: 'border-orange-200 bg-orange-50 text-orange-900', iconColor: 'text-orange-500' },
  { id: 'verde', name: 'Faixa Verde', color: 'border-emerald-200 bg-emerald-50 text-emerald-900', iconColor: 'text-emerald-500' },
  { id: 'azul', name: 'Faixa Azul', color: 'border-blue-200 bg-blue-50 text-blue-900', iconColor: 'text-blue-500' },
  { id: 'marrom', name: 'Faixa Marrom', color: 'border-amber-200 bg-amber-50 text-amber-900', iconColor: 'text-amber-800' },
  { id: 'preta', name: 'Faixa Preta', color: 'border-slate-900 bg-slate-100 text-slate-900', iconColor: 'text-slate-900' },
];

export default function ApostilaPage() {
  const firestore = useFirestore();

  const handbookQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'handbook');
  }, [firestore]);

  const { data: dbHandbook, isLoading } = useCollection<HandbookContent>(handbookQuery);

  const handbookMap = useMemo(() => {
    const map: Record<string, HandbookContent> = {};
    if (dbHandbook) {
      dbHandbook.forEach(item => {
        map[item.id] = item;
      });
    }
    return map;
  }, [dbHandbook]);

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-emerald-600" />
            Apostila Técnica
          </h1>
          <p className="text-muted-foreground">Currículo de graduação e lista de exercícios por faixa.</p>
        </div>
        <Link href="/configuracoes?tab=apostila">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Gerenciar Matérias
          </Button>
        </Link>
      </div>

      <Card className="bg-blue-50/50 border-blue-100 border-none shadow-sm">
        <CardContent className="p-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 leading-relaxed">
            Consulte abaixo a matéria técnica oficial para cada graduação. Os itens são organizados linha a linha para facilitar o ensino e acompanhamento dos alunos.
          </p>
        </CardContent>
      </Card>

      <Accordion type="multiple" className="w-full space-y-4">
        {BELTS.map((belt) => {
          const data = handbookMap[belt.id];
          const techniques = data?.techniques || [];

          return (
            <AccordionItem 
              key={belt.id} 
              value={belt.id} 
              className={cn("border rounded-2xl px-4 overflow-hidden transition-all shadow-sm", belt.color)}
            >
              <AccordionTrigger className="hover:no-underline py-5">
                <div className="flex items-center gap-4">
                  <div className={cn("p-2 rounded-full bg-white/80 shadow-inner", belt.iconColor)}>
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-lg font-black uppercase tracking-tight block leading-none">{belt.name}</span>
                    <span className="text-[10px] font-bold uppercase opacity-60">
                      {techniques.length} técnicas cadastradas
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-8">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : techniques.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {techniques.map((tech, index) => (
                      <div 
                        key={index} 
                        className="group flex items-center gap-4 p-4 rounded-xl bg-white/60 hover:bg-white transition-colors border border-transparent hover:border-current/10"
                      >
                        <div className="w-8 h-8 rounded-lg bg-current/5 flex items-center justify-center shrink-0">
                          <span className="text-xs font-black opacity-40">{index + 1}</span>
                        </div>
                        <p className="text-sm font-medium leading-tight flex-1">{tech}</p>
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-20 transition-opacity" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-white/40 rounded-xl border border-dashed border-current/20">
                    <p className="text-sm text-muted-foreground italic">Nenhuma matéria técnica cadastrada para esta faixa.</p>
                    <Link href="/configuracoes?tab=apostila">
                      <Button variant="link" size="sm" className="mt-2 font-bold uppercase text-[10px]">
                        Clique aqui para adicionar
                      </Button>
                    </Link>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
