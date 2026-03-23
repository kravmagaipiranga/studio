
"use client";

import { useState, useMemo, useEffect } from "react";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { Student, GlobalParameters, MessageTemplate } from "@/lib/types";
import { DEFAULT_TEMPLATES } from "@/lib/message-templates";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MessageSquare, Mail, UserPlus, Users, Send, Info, CheckCircle2, RotateCcw, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";


export default function CentralDeMensagensPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // Data Fetching
  const studentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'students'), orderBy('name', 'asc'));
  }, [firestore]);

  const templatesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'messageTemplates'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);
  const { data: dbTemplates, isLoading: isLoadingTemplates } = useCollection<MessageTemplate>(templatesQuery);

  const templates = useMemo(() => {
    const list = [...(dbTemplates || [])];
    // Add default templates if they don't exist in DB
    DEFAULT_TEMPLATES.forEach(def => {
      if (!list.find(t => t.id === def.id || t.name === def.name)) {
        list.push(def);
      }
    });
    return list;
  }, [dbTemplates]);

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState("");
  const [customBody, setBody] = useState("");
  const [customSubject, setSubject] = useState("");

  // Initialize template
  useEffect(() => {
    if (templates.length > 0) {
      const initialId = activeTemplateId || templates[0].id;
      const tpl = templates.find(t => t.id === initialId);
      if (tpl) {
        setActiveTemplateId(tpl.id);
        setBody(tpl.body);
        setSubject(tpl.subject);
      }
    }
  }, [templates, activeTemplateId]);

  // Filtering
  const filteredStudents = useMemo(() => {
    if (!students) return [];
    return students.filter(s => 
      s.status === 'Ativo' && 
      (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [students, searchQuery]);

  const selectedStudents = useMemo(() => {
    if (!students) return [];
    return students.filter(s => selectedIds.includes(s.id));
  }, [students, selectedIds]);

  // Handlers
  const toggleStudent = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map(s => s.id));
    }
  };

  const replacePlaceholders = (text: string, student: Student) => {
    const vencimento = student.planExpirationDate ? format(parseISO(student.planExpirationDate), 'dd/MM/yyyy') : 'Não informada';
    const ultimoPgto = student.lastPaymentDate ? format(parseISO(student.lastPaymentDate), 'dd/MM/yyyy') : 'N/A';
    const inicio = student.startDate ? format(parseISO(student.startDate), 'dd/MM/yyyy') : 'N/A';
    const valor = student.planValue ? student.planValue.toFixed(2) : '0.00';

    return text
      .replace(/{{nome}}/g, student.name.split(' ')[0])
      .replace(/{{nome_completo}}/g, student.name)
      .replace(/{{vencimento}}/g, vencimento)
      .replace(/{{ultimo_pagamento}}/g, ultimoPgto)
      .replace(/{{plano}}/g, student.planType || 'Mensal')
      .replace(/{{valor}}/g, valor)
      .replace(/{{inicio}}/g, inicio);
  };

  const handleSendWhatsApp = (student: Student) => {
    const message = replacePlaceholders(customBody, student);
    const phone = student.phone?.replace(/\D/g, '');
    if (!phone) {
      toast({ variant: "destructive", title: "Erro", description: `Aluno ${student.name} não possui telefone.` });
      return;
    }
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSendEmail = (student: Student) => {
    const message = replacePlaceholders(customBody, student);
    const subject = replacePlaceholders(customSubject, student);
    if (!student.email) {
      toast({ variant: "destructive", title: "Erro", description: `Aluno ${student.name} não possui e-mail.` });
      return;
    }
    
    // Gmail Compose URL format: https://mail.google.com/mail/?view=cm&fs=1&to=TO&su=SUBJECT&body=BODY
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(student.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    
    window.open(gmailUrl, '_blank');
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Central de Mensagens</h1>
          <p className="text-muted-foreground">Comunicação rápida e personalizada com seus alunos.</p>
        </div>
        <Link href="/configuracoes?tab=mensagens">
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Configurar Modelos
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Coluna de Seleção de Alunos */}
        <Card className="lg:col-span-4 flex flex-col h-[600px] lg:h-[750px]">
          <CardHeader className="pb-3 border-b shrink-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Selecionar Destinatários
            </CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar aluno..." 
                className="pl-8" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between mt-4">
              <Button variant="ghost" size="sm" className="text-xs" onClick={toggleAll}>
                {selectedIds.length === filteredStudents.length ? "Desmarcar Todos" : "Selecionar Todos"}
              </Button>
              <Badge variant="secondary" className="text-[10px]">
                {selectedIds.length} selecionados
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {isLoadingStudents ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="divide-y">
                  {filteredStudents.map(student => (
                    <div 
                      key={student.id} 
                      className={cn(
                        "flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer",
                        selectedIds.includes(student.id) && "bg-blue-50/50"
                      )}
                      onClick={() => toggleStudent(student.id)}
                    >
                      <Checkbox checked={selectedIds.includes(student.id)} onCheckedChange={() => toggleStudent(student.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{student.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{student.belt} • {student.planType || 'Mensal'}</p>
                      </div>
                      {student.planExpirationDate && (
                        <div className="text-right">
                           <p className="text-[9px] font-bold uppercase text-muted-foreground">Vence em</p>
                           <p className="text-[10px] font-mono">{format(parseISO(student.planExpirationDate), 'dd/MM')}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Coluna de Configuração da Mensagem */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Editor */}
          <Card className="shadow-md">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                Configurar Mensagem
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Modelo</label>
                  <Select value={activeTemplateId} onValueChange={setActiveTemplateId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Assunto (E-mail)</label>
                  <Input value={customSubject} onChange={e => setSubject(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Conteúdo da Mensagem</label>
                  <div className="flex gap-1">
                    {["nome", "vencimento", "valor", "plano"].map(tag => (
                      <Badge 
                        key={tag} 
                        variant="outline" 
                        className="text-[9px] cursor-pointer hover:bg-muted"
                        onClick={() => setBody(prev => prev + `{{${tag}}}`)}
                      >
                        + {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Textarea 
                  className="min-h-[250px] font-sans text-sm leading-relaxed" 
                  value={customBody}
                  onChange={e => setBody(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  As tags entre chaves serão substituídas pelos dados reais do aluno no momento do envio.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Fila de Envio */}
          <Card className="border-emerald-100">
            <CardHeader className="pb-3 border-b bg-emerald-50/30">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-emerald-600" />
                  Fila de Disparo
                </div>
                {selectedIds.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedIds([])}>
                    <RotateCcw className="h-3 w-3 mr-1" /> Limpar Lista
                  </Button>
                )}
              </CardTitle>
              <CardDescription>Clique nos botões para abrir o chat ou e-mail de cada aluno.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] w-full">
                {selectedIds.length === 0 ? (
                  <div className="p-10 text-center text-muted-foreground flex flex-col items-center gap-2">
                    <UserPlus className="h-8 w-8 opacity-20" />
                    <p className="text-sm">Nenhum aluno selecionado na coluna ao lado.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {selectedStudents.map(student => (
                      <div key={student.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{student.name}</p>
                            <p className="text-[10px] text-muted-foreground">{student.phone || student.email || 'Sem contato'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs border-green-200 text-green-700 hover:bg-green-50"
                            onClick={() => handleSendWhatsApp(student)}
                            disabled={!student.phone}
                          >
                            <MessageSquare className="h-3 w-3 mr-2" /> WhatsApp
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                            onClick={() => handleSendEmail(student)}
                            disabled={!student.email}
                          >
                            <Mail className="h-3 w-3 mr-2" /> E-mail
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            {selectedIds.length > 0 && (
              <div className="p-4 bg-muted/20 border-t">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Total de {selectedIds.length} disparos pendentes.
                </div>
              </div>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
}
