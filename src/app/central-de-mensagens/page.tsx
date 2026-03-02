
"use client";

import { useState, useMemo, useEffect } from "react";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { Student, GlobalParameters } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MessageSquare, Mail, UserPlus, Users, Send, Info, CheckCircle2, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type MessageTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

export default function CentralDeMensagensPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // Data Fetching
  const studentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'students'), orderBy('name', 'asc'));
  }, [firestore]);

  const paramsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'parameters', 'global');
  }, [firestore]);

  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);
  const { data: schoolParams } = useDoc<GlobalParameters>(paramsRef);

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState("vencimento");
  const [customBody, setBody] = useState("");
  const [customSubject, setSubject] = useState("");

  const templates: MessageTemplate[] = [
    {
      id: "vencimento",
      name: "Lembrete de Vencimento",
      subject: "Lembrete de Mensalidade - Krav Magá Ipiranga",
      body: `Olá, {{nome}}! Tudo bem? 👊

Passando para lembrar que seu plano de Krav Magá ({{plano}}) vence em {{vencimento}}.

O valor para renovação é R$ {{valor}}.

Caso queira agilizar, você pode pagar via PIX usando a chave: thiago@kravmaga.org.br (CNPJ: 31.116.136/0001-95).

Se o pagamento já foi realizado, por favor desconsidere esta mensagem. Qualquer dúvida, estamos à disposição!

Kida! 🛡️`
    },
    {
      id: "boas_vindas",
      name: "Boas-vindas",
      subject: "Bem-vindo ao CT Krav Magá Ipiranga!",
      body: `Olá, {{nome}}! Seja muito bem-vindo(a) ao nosso Centro de Treinamento! 🥊

Ficamos felizes em ter você conosco. Lembre-se que seu plano foi registrado como {{plano}} e sua data de início foi {{inicio}}.

Aqui vão algumas dicas para você aproveitar ao máximo suas aulas conosco!

- Nosso Centro de Treinamento possui vestiários e armários. Use-os como precisar, seja para colocar seu uniforme ou roupa de treino depois de chegar na academia, seja para guardar seus pertences em segurança (não use relógios, pulseiras, colares ou anéis durante os treinos, eles podem causar graves acidentes ou quebrar).
- Antes de entrar ou sair do tatame, avise o instrutor. Isso é importante para evitar acidentes e para todos saberem que você está bem.
- Ouça seu corpo e obedeça ao seu ritmo individual. Qualquer lesão ocorrida pelo excesso de disposição ou pela falta de preparo irá atrapalhar sua rotina e trazer problemas. 
- Ouça seu instrutor! Ele já tem muito tempo de experiência, e irá ajudá-lo a encontrar seu ritmo de treino e a maneira correta de fazê-lo sem se lesionar, aprendendo a técnica de forma mais rápida. Não deixe que a ansiedade e o ego atrapalhem suas ações e causem danos a você e a seu corpo!
- Comece devagar. Essa é a melhor forma de ganhar, gradualmente, força, agilidade e técnica, sem se machucar. Mantenha o foco na técnica e na execução do exercício, e espere o momento certo para aumentar força e velocidade. Fazer certo é melhor que fazer rápido. Quando a técnica estiver boa, gradativamente aumente sua velocidade e sua intensidade de treino.
- Absorva o máximo de informações possível. Aulas de Krav Magá exigem concentração e atenção do aluno.
- Pergunte. Não tenha medo de fazer perguntas quando não entender algo. Seu instrutor e seus colegas de treino estão lá para ajudar você! Todos sairão ganhando quando você entender o exercício corretamente. 
- Treine! Não é preciso falar, mas, o único jeito de aprender e ficar bom em algo é treinando. Repita o exercício incontáveis números de vezes, não pare o treino enquanto o instrutor não solicitar ou não mudar de exercício. Preste atenção em cada detalhe do movimento e de seu corpo.

Dicas para Recuperação Pós Aula:
- Hidrate-se! Beba bastante água durante o dia, antes e após seu treino. Se preciso for, beba também durante, mas DO LADO DE FORA do tatame. A água ajuda na recuperação muscular e no funcionamento correto do seu corpo. Desidratação pode causar cãibra, fadiga e outros problemas mais graves.
- Alongue! O alongamento ajuda a prevenir lesões. Alongamentos dinâmicos ajudam a soltar a musculatura e deixá-los prontos para o exercício, enquanto alongamentos estáticos ajudam a deixar a musculatura menos rígida e menos dolorida.
- Descanse! Dê ao seu corpo um tempo de recuperação após a aula. Tenha uma boa noite de sono e se alimente de uma forma saudável para seus músculos se recuperarem! E não se assuste caso você sinta algum tipo de desconforto ou dor muscular após as primeiras aulas. Essa condição é absolutamente normal, e durará até que seu corpo se acostume com as aulas.

Tome sempre todos os cuidados necessários e mantenha o foco e a determinação para atingir seus objetivos. Só assim você será capaz de ir longe e obter sempre os melhores resultados, no seu treino e na sua vida!

Qualquer dúvida sobre horários ou uniformes, pode nos chamar por aqui.

Bom treino! Kida! 👊`
    },
    {
      id: "personalizada",
      name: "Mensagem em Branco",
      subject: "Aviso Importante - Krav Magá Ipiranga",
      body: "Olá, {{nome}}!\n\n"
    }
  ];

  // Initialize template
  useEffect(() => {
    const tpl = templates.find(t => t.id === activeTemplateId);
    if (tpl) {
      setBody(tpl.body);
      setSubject(tpl.subject);
    }
  }, [activeTemplateId]);

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
    window.location.href = `mailto:${student.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Central de Mensagens</h1>
          <p className="text-muted-foreground">Comunicação rápida e personalizada com seus alunos.</p>
        </div>
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
