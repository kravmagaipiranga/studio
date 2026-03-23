
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
import { DEFAULT_TEMPLATES } from "@/lib/message-templates";
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
  const [newTemplate, setNewTemplate] = useState<Partial<MessageTemplate> | null>(null);
  const [localTemplates, setLocalTemplates] = useState<Record<string, MessageTemplate>>({});
  const [savingTemplateId, setSavingTemplateId] = useState<string | null>(null);

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

  useEffect(() => {
    if (templates.length > 0) {
      setLocalTemplates(prev => {
        const updated = { ...prev };
        templates.forEach(tpl => {
          if (!updated[tpl.id]) {
            updated[tpl.id] = { ...tpl };
          }
        });
        return updated;
      });
    }
  }, [templates]);

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
  const handleSaveTemplate = async (id: string) => {
    if (!firestore) return;
    setSavingTemplateId(id);
    try {
      const tpl = localTemplates[id];
      const dataToSave = { ...tpl, id, subject: tpl.subject || "Aviso Importante" };
      await setDocumentNonBlocking(doc(firestore, 'messageTemplates', id), dataToSave, { merge: true });
      toast({ title: "Modelo Salvo", description: `"${tpl.name}" foi atualizado.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao Salvar" });
    } finally {
      setSavingTemplateId(null);
    }
  };

  const handleSaveNewTemplate = async () => {
    if (!firestore || !newTemplate) return;
    setSavingTemplateId('new');
    try {
      const id = uuidv4();
      const dataToSave = { ...newTemplate, id, subject: newTemplate.subject || "Aviso Importante" } as MessageTemplate;
      await setDocumentNonBlocking(doc(firestore, 'messageTemplates', id), dataToSave, { merge: true });
      toast({ title: "Modelo Criado" });
      setNewTemplate(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao Salvar" });
    } finally {
      setSavingTemplateId(null);
    }
  };

  const updateLocalTemplate = (id: string, field: keyof MessageTemplate, value: string) => {
    setLocalTemplates(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Modelos de Mensagem</h2>
              <p className="text-sm text-muted-foreground">Edite os modelos usados no WhatsApp e e-mail. Cada modelo é compartilhado entre os dois canais.</p>
            </div>
            <Button size="sm" onClick={() => setNewTemplate({ name: "", subject: "", body: "" })}>
              <Plus className="h-4 w-4 mr-2" /> Novo Modelo
            </Button>
          </div>

          {newTemplate && (
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                  <Plus className="h-4 w-4" /> Novo Modelo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Modelo</Label>
                    <Input
                      placeholder="Ex: Cobrança, Aniversário..."
                      value={newTemplate.name}
                      onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">Assunto <Badge variant="outline" className="text-[9px] ml-1">E-mail</Badge></Label>
                    <Input
                      placeholder="Ex: Aviso Importante - Krav Magá Ipiranga"
                      value={newTemplate.subject}
                      onChange={e => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Corpo da Mensagem
                    <Badge variant="outline" className="text-[9px]">WhatsApp</Badge>
                    <Badge variant="outline" className="text-[9px]">E-mail</Badge>
                  </Label>
                  <Textarea
                    rows={8}
                    placeholder="Digite a mensagem. Use {{nome}}, {{vencimento}}, {{plano}}, {{valor}}, {{inicio}} como variáveis."
                    value={newTemplate.body}
                    onChange={e => setNewTemplate({ ...newTemplate, body: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setNewTemplate(null)}>Cancelar</Button>
                  <Button onClick={handleSaveNewTemplate} disabled={savingTemplateId === 'new'}>
                    {savingTemplateId === 'new' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Criar Modelo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoadingTemplates ? (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map(tpl => {
                const local = localTemplates[tpl.id];
                if (!local) return null;
                const isSaving = savingTemplateId === tpl.id;
                return (
                  <Card key={tpl.id}>
                    <CardHeader className="pb-3 border-b bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-emerald-600" />
                          <Input
                            className="h-8 text-sm font-bold border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 w-auto"
                            value={local.name}
                            onChange={e => updateLocalTemplate(tpl.id, 'name', e.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px]">WhatsApp</Badge>
                          <Badge variant="outline" className="text-[9px]">E-mail</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1 text-xs text-muted-foreground uppercase font-bold">
                          Assunto <Badge variant="secondary" className="text-[8px] ml-1">apenas e-mail</Badge>
                        </Label>
                        <Input
                          value={local.subject}
                          onChange={e => updateLocalTemplate(tpl.id, 'subject', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground uppercase font-bold">Corpo da Mensagem</Label>
                        <Textarea
                          rows={10}
                          className="font-sans text-sm leading-relaxed"
                          value={local.body}
                          onChange={e => updateLocalTemplate(tpl.id, 'body', e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground italic">
                          Variáveis disponíveis: <code>{'{{nome}}'}</code>, <code>{'{{vencimento}}'}</code>, <code>{'{{plano}}'}</code>, <code>{'{{valor}}'}</code>, <code>{'{{inicio}}'}</code>
                        </p>
                      </div>
                      <div className="flex justify-end">
                        <Button size="sm" onClick={() => handleSaveTemplate(tpl.id)} disabled={isSaving}>
                          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                          Salvar "{local.name}"
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
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
