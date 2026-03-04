
"use client";

import { useState, useEffect, useMemo } from "react";
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, useCollection, deleteDocumentNonBlocking } from "@/firebase";
import { collection, getDocs, doc, writeBatch, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, ShieldAlert, Loader2, Database, FileJson, AlertTriangle, Building2, GraduationCap, Save, RefreshCw, MessageSquare, Plus, Trash2, Edit3, CheckCircle2, BookOpen, Copy } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlobalParameters, Student, MessageTemplate, HandbookContent } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { v4 as uuidv4 } from 'uuid';

const collectionsToBackup = [
  'students', 
  'payments', 
  'giftCardOrders', 
  'womensMonth',
  'appointments', 
  'privateClasses', 
  'seminars', 
  'sales',
  'exams', 
  'indicators', 
  'tasks', 
  'leads',
  'attendance',
  'parameters',
  'companies',
  'messageTemplates',
  'handbook'
];

const DEFAULT_TEMPLATES: MessageTemplate[] = [
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
- Comece devagar. Essa é a melhor forma de ganhar, gradualmente, força, agilidade e técnica, sem se machucar. Mantenha o foco na técnica e na execução do exercício, e espere o momento certo para aumentar força e velocidade. Fazer certo é melhor que fazer rápido. Quando a técnica estiver boa, gradativamente aumente seu velocidade e sua intensidade de treino.
- Absorva o máximo de informações possível. Aulas de Krav Magá exigem concentração e atenção do aluno.
- Pergunte. Não tenha medo de fazer perguntas quando não entender algo. Seu instrutor e seus colegas de treino estão lá para ajudar você! Todos sairão ganhando quando você entender o exercício corretamente. 
- Treine! Não é preciso falar, mas, o único jeito de aprender e ficar bom em algo é treinando. Repita o exercício incontáveis números de vezes, não pare o treino enquanto o instrutor não solicitar ou não mudar de exercício. Preste atenção em cada detalhe do movimento e de seu corpo.

Dicas para Recuperação Pós Aula:
- Hidrate-se! Beba bastante água durante o dia, antes e após seu treino. Se preciso for, beba também durante, mas DO LADO DE FORA do tatame. A água ajuda na recuperação muscular e no funcionamento correto do seu corpo. Desidratação pode causar cãibra, fadiga e outros problemas mais graves.
- Alongue! O alongamento ajuda a prevenir leões. Alongamentos dinâmicos ajudam a soltar a musculatura e deixá-los prontos para o exercício, enquanto alongamentos estáticos ajudam a deixar a musculatura menos rígida e menos dolorida.
- Descanse! Dê ao seu corpo um tempo de recuperação após a aula. Tenha uma boa noite de sono e se alimente de uma forma saudável para seus músculos se recuperarem! E não se assuste caso você sinta algum tipo de desconforto ou dor muscular após as primeiras aulas. Essa condição é absolutamente normal, e durará até que seu corpo se acostume com as aulas.

Tome sempre todos os cuidados necessários e mantenha o foco e a determinação para atingir seus objetivos. Só assim você será capaz de ir longe e obter sempre os melhores resultados, no seu treino e na sua vida!

Qualquer dúvida sobre horários ou uniformes, pode nos chamar por aqui.

Bom treino! Kida! 👊`
  }
];

const DEFAULT_PARAMETERS: GlobalParameters = {
  id: 'global',
  schoolName: "CT Krav Magá IPIRANGA",
  schoolCnpj: "31.116.136/0001-95",
  schoolAddress: "Rua Tabor, 482 - Ipiranga - São Paulo - SP",
  schoolPhone: "11 2589-6049",
  attendanceTargetPerWeek: 2,
  beltRules: {
    branca: 4,
    amarela: 12,
    laranja: 18,
    verde: 24,
    azul: 24,
    marrom: 36,
  }
};

const BELTS = [
  { id: 'branca', name: 'Faixa Branca (Iniciante)', color: 'bg-slate-50 border-slate-200 text-slate-900' },
  { id: 'amarela', name: 'Faixa Amarela', color: 'bg-yellow-50 border-yellow-200 text-yellow-900' },
  { id: 'laranja', name: 'Faixa Laranja', color: 'bg-orange-50 border-orange-200 text-orange-900' },
  { id: 'verde', name: 'Faixa Verde', color: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
  { id: 'azul', name: 'Faixa Azul', color: 'bg-blue-50 border-blue-200 text-blue-900' },
  { id: 'marrom', name: 'Faixa Marrom', color: 'bg-amber-50 border-amber-200 text-amber-900' },
  { id: 'preta', name: 'Faixa Preta', color: 'bg-slate-100 border-slate-900 text-slate-900' },
];

const beltOrder: (keyof GlobalParameters['beltRules'])[] = ['branca', 'amarela', 'laranja', 'verde', 'azul', 'marrom'];

const beltDisplay: Record<string, { label: string, color: string, textColor: string }> = {
  branca: { label: 'Branca', color: 'bg-white border-gray-300', textColor: 'text-black' },
  amarela: { label: 'Amarela', color: 'bg-yellow-400 border-yellow-500', textColor: 'text-black' },
  laranja: { label: 'Laranja', color: 'bg-orange-50 border-orange-600', textColor: 'text-white' },
  verde: { label: 'Verde', color: 'bg-green-500 border-green-600', textColor: 'text-white' },
  azul: { label: 'Azul', color: 'bg-blue-500 border-blue-600', textColor: 'text-white' },
  marrom: { label: 'Marrom', color: 'bg-amber-800 border-amber-900', textColor: 'text-white' },
};

export default function ConfiguracoesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSavingParams, setIsSavingParams] = useState(false);
  const [localParams, setLocalParams] = useState<GlobalParameters>(DEFAULT_PARAMETERS);

  // Apostila State
  const [localHandbook, setLocalHandbook] = useState<Record<string, string>>({});
  const [isSavingHandbook, setIsSavingHandbook] = useState(false);

  // Message Template State
  const [editingTemplate, setEditingTemplate] = useState<Partial<MessageTemplate> | null>(null);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const paramsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'parameters', 'global');
  }, [firestore]);

  const templatesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'messageTemplates'), orderBy('name', 'asc'));
  }, [firestore]);

  const handbookQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'handbook');
  }, [firestore]);

  const { data: dbParams, isLoading: isLoadingParams } = useDoc<GlobalParameters>(paramsRef);
  const { data: dbTemplates, isLoading: isLoadingTemplates } = useCollection<MessageTemplate>(templatesQuery);
  const { data: dbHandbook, isLoading: isLoadingHandbook } = useCollection<HandbookContent>(handbookQuery);

  const templates = useMemo(() => {
    const list = [...(dbTemplates || [])];
    DEFAULT_TEMPLATES.forEach(def => {
      if (!list.find(t => t.id === def.id || t.name === def.name)) {
        list.push(def);
      }
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [dbTemplates]);

  useEffect(() => {
    if (dbParams) setLocalParams(dbParams);
  }, [dbParams]);

  useEffect(() => {
    if (dbHandbook) {
      const contentMap: Record<string, string> = {};
      dbHandbook.forEach(item => {
        contentMap[item.id] = item.content;
      });
      setLocalHandbook(contentMap);
    }
  }, [dbHandbook]);

  const handleBackup = async () => {
    if (!firestore) return;
    setIsBackingUp(true);
    try {
      const backupData: Record<string, any[]> = {};
      for (const colName of collectionsToBackup) {
        const querySnapshot = await getDocs(collection(firestore, colName));
        backupData[colName] = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      }
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_kravmaga_ipiranga_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      toast({ title: "Backup Concluído!", description: "O arquivo de dados foi gerado e baixado com sucesso." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro no Backup", description: "Não foi possível extrair os dados." });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !firestore) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        setIsRestoring(true);
        let totalProcessed = 0;
        for (const colName in data) {
          if (collectionsToBackup.includes(colName)) {
            const docs = data[colName];
            for (const docData of docs) {
              const { id, ...payload } = docData;
              if (id) {
                const docRef = doc(firestore, colName, id);
                await setDocumentNonBlocking(docRef, payload, { merge: true });
                totalProcessed++;
              }
            }
          }
        }
        toast({ title: "Restauração Finalizada!", description: `${totalProcessed} registros sincronizados.` });
      } catch (err) {
        toast({ variant: "destructive", title: "Falha na Restauração", description: "Arquivo inválido." });
      } finally {
        setIsRestoring(false);
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleSaveParameters = async () => {
    if (!firestore) return;
    setIsSavingParams(true);
    try {
      await setDocumentNonBlocking(doc(firestore, 'parameters', 'global'), localParams, { merge: true });
      toast({ title: "Configurações Salvas" });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao Salvar" });
    } finally {
      setIsSavingParams(false);
    }
  };

  const handleUpdateAllStudentPlans = async () => {
    if (!firestore) return;
    setIsSavingParams(true);
    try {
      const querySnapshot = await getDocs(collection(firestore, 'students'));
      const batch = writeBatch(firestore);
      let count = 0;
      querySnapshot.forEach((studentDoc) => {
        const data = studentDoc.data() as Student;
        let newVal = data.planValue;
        if (data.planType === 'Mensal') newVal = 330;
        if (data.planType === 'Matrícula') newVal = 170;
        if (data.planType === 'Trimestral') newVal = 940;
        if (data.planType === 'Bolsa 50%') newVal = 165;
        if (newVal !== data.planValue) {
          batch.update(studentDoc.ref, { planValue: newVal });
          count++;
        }
      });
      await batch.commit();
      toast({ title: "Atualização Concluída", description: `${count} alunos atualizados.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro na atualização" });
    } finally {
      setIsSavingParams(false);
    }
  };

  const handleSaveHandbook = async (beltId: string, beltName: string) => {
    if (!firestore) return;
    setIsSavingHandbook(true);
    try {
      const content = localHandbook[beltId] || "";
      // Split by newline and filter empty items
      const techniques = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const data: HandbookContent = {
        id: beltId,
        beltName,
        content,
        techniques,
        updatedAt: new Date().toISOString()
      };
      await setDocumentNonBlocking(doc(firestore, 'handbook', beltId), data, { merge: true });
      toast({ title: "Apostila Atualizada", description: `Matéria da ${beltName} salva.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao salvar" });
    } finally {
      setIsSavingHandbook(false);
    }
  };

  const handleCopyFromClipboard = async (beltId: string) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setLocalHandbook(prev => ({ ...prev, [beltId]: text }));
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível acessar a área de transferência." });
    }
  };

  // Message Template Handlers
  const handleSaveTemplate = async () => {
    if (!firestore || !editingTemplate) return;
    setIsSavingTemplate(true);
    try {
      const id = editingTemplate.id || uuidv4();
      const dataToSave = { ...editingTemplate, id, subject: editingTemplate.subject || "Aviso Importante" };
      await setDocumentNonBlocking(doc(firestore, 'messageTemplates', id), dataToSave, { merge: true });
      toast({ title: "Modelo Salvo" });
      setEditingTemplate(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao Salvar" });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações do Sistema</h1>
        <p className="text-muted-foreground">Gerencie a identidade da escola, regras acadêmicas e segurança dos dados.</p>
      </div>

      <Tabs defaultValue="identidade" className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
          <TabsTrigger value="identidade">Escola</TabsTrigger>
          <TabsTrigger value="academico">Acadêmico</TabsTrigger>
          <TabsTrigger value="apostila">Apostila</TabsTrigger>
          <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="identidade" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Dados da Instituição
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingParams ? <Skeleton className="h-40 w-full" /> : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Nome da Escola</Label><Input value={localParams.schoolName} onChange={e => setLocalParams({...localParams, schoolName: e.target.value})} /></div>
                    <div className="space-y-2"><Label>CNPJ</Label><Input value={localParams.schoolCnpj} onChange={e => setLocalParams({...localParams, schoolCnpj: e.target.value})} /></div>
                  </div>
                  <div className="space-y-2"><Label>Endereço Completo</Label><Input value={localParams.schoolAddress} onChange={e => setLocalParams({...localParams, schoolAddress: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Telefone de Contato</Label><Input value={localParams.schoolPhone} onChange={e => setLocalParams({...localParams, schoolPhone: e.target.value})} /></div>
                  <div className="flex justify-end pt-4"><Button onClick={handleSaveParameters} disabled={isSavingParams}>Salvar Alterações</Button></div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academico" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-emerald-600" />
                Regras e Metas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Frequência Esperada</h4>
                <div className="flex items-end gap-4 max-w-xs">
                  <div className="space-y-2 flex-1"><Label>Aulas por Semana (Meta)</Label><Input type="number" value={localParams.attendanceTargetPerWeek} onChange={e => setLocalParams({...localParams, attendanceTargetPerWeek: parseInt(e.target.value) || 0})} /></div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Manutenção de Alunos</h4>
                <div className="p-4 border rounded-lg bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1"><p className="text-sm font-bold">Atualizar Valores de Março/2025</p></div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="outline" size="sm">Atualizar Todos</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Atualizar todos os planos?</AlertDialogTitle><AlertDialogDescription>Aplica a nova tabela de preços em todos os cadastros.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleUpdateAllStudentPlans}>Confirmar</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
              </div>
              <div className="flex justify-end pt-4"><Button onClick={handleSaveParameters} disabled={isSavingParams}>Salvar Regras</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apostila" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                Gestão de Matérias (Apostila)
              </CardTitle>
              <CardDescription>Cole as técnicas de cada faixa. Cada linha será tratada como um item separado na apostila.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {BELTS.map(belt => (
                <div key={belt.id} className="space-y-3 p-4 border rounded-xl bg-muted/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", beltDisplay[belt.id]?.color || "bg-slate-200")} />
                      <span className="font-bold text-sm uppercase">{belt.name}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => handleCopyFromClipboard(belt.id)}>
                      <Copy className="h-3 w-3 mr-1" /> Colar
                    </Button>
                  </div>
                  <Textarea 
                    placeholder="Cole as técnicas aqui, uma por linha..." 
                    className="font-mono text-xs h-32"
                    value={localHandbook[belt.id] || ""}
                    onChange={e => setLocalHandbook({...localHandbook, [belt.id]: e.target.value})}
                  />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => handleSaveHandbook(belt.id, belt.name)} disabled={isSavingHandbook}>
                      Salvar {belt.id}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mensagens" className="space-y-6 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Modelos de Mensagem</CardTitle></div>
              <Button size="sm" onClick={() => setEditingTemplate({ name: "", subject: "", body: "" })}><Plus className="h-4 w-4 mr-2" /> Novo Modelo</Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {editingTemplate ? (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Nome do Modelo</Label><Input value={editingTemplate.name} onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Assunto (E-mail)</Label><Input value={editingTemplate.subject} onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })} /></div>
                  </div>
                  <div className="space-y-2"><Label>Corpo da Mensagem</Label><Textarea rows={10} value={editingTemplate.body} onChange={e => setEditingTemplate({ ...editingTemplate, body: e.target.value })} /></div>
                  <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setEditingTemplate(null)}>Cancelar</Button><Button onClick={handleSaveTemplate} disabled={isSavingTemplate}>Salvar Modelo</Button></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(tpl => (
                    <div key={tpl.id} className="p-4 border rounded-lg group">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-bold text-sm">{tpl.name}</h5>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingTemplate(tpl)}><Edit3 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 italic">{tpl.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca" className="space-y-6 pt-4">
          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader><CardTitle>Segurança e Backup</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white rounded-lg border shadow-sm">
                <div className="flex-1"><p className="text-sm font-bold">Gerar Backup Completo</p></div>
                <Button onClick={handleBackup} disabled={isBackingUp}>Baixar Dados</Button>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white rounded-lg border shadow-sm">
                <div className="flex-1"><p className="text-sm font-bold">Restaurar de Arquivo</p></div>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="outline">Carregar Backup</Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Atenção: Operação Crítica</AlertDialogTitle></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><div className="relative"><Input type="file" accept=".json" onChange={handleRestore} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isRestoring} /><Button disabled={isRestoring}>Confirmar</Button></div></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
