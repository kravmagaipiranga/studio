
"use client";

import { useState, useEffect, useMemo } from "react";
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, useCollection, deleteDocumentNonBlocking } from "@/firebase";
import { collection, getDocs, doc, writeBatch, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, ShieldAlert, Loader2, Database, FileJson, AlertTriangle, Building2, GraduationCap, Save, RefreshCw, MessageSquare, Plus, Trash2, Edit3, CheckCircle2 } from "lucide-react";
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
import { GlobalParameters, Student, MessageTemplate } from "@/lib/types";
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
  'messageTemplates'
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
- Alongue! O alongamento ajuda a prevenir lesões. Alongamentos dinâmicos ajudam a soltar a musculatura e deixá-los prontos para o exercício, enquanto alongamentos estáticos ajudam a deixar a musculatura menos rígida e menos dolorida.
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

const beltOrder: (keyof GlobalParameters['beltRules'])[] = ['branca', 'amarela', 'laranja', 'verde', 'azul', 'marrom'];

const beltDisplay: Record<string, { label: string, color: string, textColor: string }> = {
  branca: { label: 'Branca', color: 'bg-white border-gray-300', textColor: 'text-black' },
  amarela: { label: 'Amarela', color: 'bg-yellow-400 border-yellow-500', textColor: 'text-black' },
  laranja: { label: 'Laranja', color: 'bg-orange-500 border-orange-600', textColor: 'text-white' },
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

  const { data: dbParams, isLoading: isLoadingParams } = useDoc<GlobalParameters>(paramsRef);
  const { data: dbTemplates, isLoading: isLoadingTemplates } = useCollection<MessageTemplate>(templatesQuery);

  const templates = useMemo(() => {
    const list = [...(dbTemplates || [])];
    // Adicionar templates padrão se não existirem no DB
    DEFAULT_TEMPLATES.forEach(def => {
      if (!list.find(t => t.id === def.id || t.name === def.name)) {
        list.push(def);
      }
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [dbTemplates]);

  useEffect(() => {
    if (dbParams) {
      setLocalParams(dbParams);
    }
  }, [dbParams]);

  const handleBackup = async () => {
    if (!firestore) return;
    setIsBackingUp(true);
    
    try {
      const backupData: Record<string, any[]> = {};
      
      for (const colName of collectionsToBackup) {
        const querySnapshot = await getDocs(collection(firestore, colName));
        backupData[colName] = querySnapshot.docs.map(doc => ({ 
          ...doc.data(), 
          id: doc.id 
        }));
      }
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_kravmaga_ipiranga_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      toast({
        title: "Backup Concluído!",
        description: "O arquivo de dados foi gerado e baixado com sucesso."
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro no Backup",
        description: "Não foi possível extrair os dados do servidor."
      });
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

        toast({
          title: "Restauração Finalizada!",
          description: `${totalProcessed} registros foram sincronizados com o banco de dados.`,
        });
      } catch (err) {
        console.error(err);
        toast({
          variant: "destructive",
          title: "Falha na Restauração",
          description: "O arquivo selecionado é inválido ou está corrompido."
        });
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
      toast({
        title: "Configurações Salvas",
        description: "Os parâmetros da escola foram atualizados com sucesso."
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: "Não foi possível salvar os parâmetros."
      });
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
        
        // Novos valores de Março/2025
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
      toast({
        title: "Atualização Concluída",
        description: `${count} alunos tiveram os valores de plano atualizados para a tabela de Março/2025.`,
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro na atualização",
        description: "Não foi possível atualizar os cadastros em massa."
      });
    } finally {
      setIsSavingParams(false);
    }
  };

  const updateParam = (field: keyof GlobalParameters, value: any) => {
    setLocalParams(prev => ({ ...prev, [field]: value }));
  };

  const updateBeltRule = (belt: keyof GlobalParameters['beltRules'], value: string) => {
    const num = parseInt(value) || 0;
    setLocalParams(prev => ({
      ...prev,
      beltRules: { ...prev.beltRules, [belt]: num }
    }));
  };

  // Message Template Handlers
  const handleSaveTemplate = async () => {
    if (!firestore || !editingTemplate) return;
    if (!editingTemplate.name || !editingTemplate.body) {
      toast({ variant: "destructive", title: "Erro", description: "Nome e Corpo da mensagem são obrigatórios." });
      return;
    }

    setIsSavingTemplate(true);
    try {
      const id = editingTemplate.id || uuidv4();
      const docRef = doc(firestore, 'messageTemplates', id);
      const dataToSave = {
        ...editingTemplate,
        id,
        subject: editingTemplate.subject || "Aviso Importante - Krav Magá Ipiranga"
      };
      await setDocumentNonBlocking(docRef, dataToSave, { merge: true });
      toast({ title: "Modelo Salvo", description: "O modelo de mensagem foi atualizado com sucesso." });
      setEditingTemplate(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao Salvar", description: "Não foi possível salvar o modelo." });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = (id: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'messageTemplates', id));
    toast({ title: "Modelo Excluído" });
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações do Sistema</h1>
        <p className="text-muted-foreground">Gerencie a identidade da escola, regras acadêmicas e segurança dos dados.</p>
      </div>

      <Tabs defaultValue="identidade" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="identidade">Escola</TabsTrigger>
          <TabsTrigger value="academico">Acadêmico</TabsTrigger>
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
              <CardDescription>Informações exibidas em recibos e comunicações oficiais.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingParams ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome da Escola</Label>
                      <Input 
                        value={localParams.schoolName} 
                        onChange={e => updateParam('schoolName', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CNPJ</Label>
                      <Input 
                        value={localParams.schoolCnpj} 
                        onChange={e => updateParam('schoolCnpj', e.target.value)} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Endereço Completo</Label>
                    <Input 
                      value={localParams.schoolAddress} 
                      onChange={e => updateParam('schoolAddress', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone de Contato</Label>
                    <Input 
                      value={localParams.schoolPhone} 
                      onChange={e => updateParam('schoolPhone', e.target.value)} 
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveParameters} disabled={isSavingParams}>
                      {isSavingParams ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Salvar Alterações
                    </Button>
                  </div>
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
              <CardDescription>Configure os parâmetros para cálculos de frequência e prontidão de exames.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Frequência Esperada</h4>
                <div className="flex items-end gap-4 max-w-xs">
                  <div className="space-y-2 flex-1">
                    <Label>Aulas por Semana (Meta)</Label>
                    <Input 
                      type="number" 
                      value={localParams.attendanceTargetPerWeek} 
                      onChange={e => updateParam('attendanceTargetPerWeek', parseInt(e.target.value) || 0)} 
                    />
                  </div>
                  <p className="text-xs text-muted-foreground pb-2">O sistema usará este valor para calcular faltas estimadas.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Manutenção de Alunos</h4>
                <div className="p-4 border rounded-lg bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                        <p className="text-sm font-bold">Atualizar Valores de Março/2025</p>
                        <p className="text-xs text-muted-foreground">Aplica Matrícula (170), Mensalidade (330) e Trimestral (940) em todos os cadastros.</p>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={isSavingParams}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Aplicar em Todos Alunos
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Atualizar todos os planos?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação modificará o valor do plano no cadastro de todos os alunos ativos para a nova tabela de preços de Março/2025.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleUpdateAllStudentPlans}>Confirmar Atualização</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Tempo Mínimo por Faixa</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {beltOrder.map((beltKey) => {
                    const config = beltDisplay[beltKey];
                    return (
                      <div key={beltKey} className="flex items-center gap-4 p-4 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow">
                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-inner shrink-0", config.color)}>
                           <span className={cn("text-xs font-black uppercase", config.textColor)}>
                             {config.label[0]}
                           </span>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-sm font-bold flex items-center gap-2">
                            {config.label}
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number" 
                              className="h-9 w-20 text-center font-semibold"
                              value={localParams.beltRules[beltKey]} 
                              onChange={e => updateBeltRule(beltKey, e.target.value)} 
                            />
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Meses</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground italic">Estes tempos definem quando um aluno aparece como "Apto para Revisão" nos indicadores técnicos.</p>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSaveParameters} disabled={isSavingParams}>
                  {isSavingParams ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar Regras
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mensagens" className="space-y-6 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Modelos de Mensagem
                </CardTitle>
                <CardDescription>Gerencie os textos prontos para a Central de Mensagens.</CardDescription>
              </div>
              <Button size="sm" onClick={() => setEditingTemplate({ name: "", subject: "", body: "" })}>
                <Plus className="h-4 w-4 mr-2" /> Novo Modelo
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {editingTemplate ? (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20 animate-in fade-in slide-in-from-top-2">
                  <h4 className="font-bold text-sm uppercase tracking-wider">{editingTemplate.id ? "Editar Modelo" : "Novo Modelo"}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Modelo (Interno)</Label>
                      <Input 
                        value={editingTemplate.name} 
                        onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })} 
                        placeholder="Ex: Lembrete de Mensalidade"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Assunto (E-mail)</Label>
                      <Input 
                        value={editingTemplate.subject} 
                        onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })} 
                        placeholder="Ex: Aviso Importante"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Corpo da Mensagem</Label>
                      <div className="flex gap-1 flex-wrap">
                        {["nome", "plano", "vencimento", "valor", "inicio"].map(tag => (
                          <Badge 
                            key={tag} 
                            variant="secondary" 
                            className="text-[9px] cursor-pointer hover:bg-muted"
                            onClick={() => setEditingTemplate({ ...editingTemplate, body: (editingTemplate.body || "") + `{{${tag}}}` })}
                          >
                            + {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Textarea 
                      rows={10}
                      value={editingTemplate.body} 
                      onChange={e => setEditingTemplate({ ...editingTemplate, body: e.target.value })} 
                      placeholder="Use {{nome}} para o nome do aluno..."
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={() => setEditingTemplate(null)}>Cancelar</Button>
                    <Button onClick={handleSaveTemplate} disabled={isSavingTemplate}>
                      {isSavingTemplate ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Salvar Modelo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isLoadingTemplates ? (
                    <>
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </>
                  ) : templates && templates.length > 0 ? (
                    templates.map(tpl => (
                      <div key={tpl.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow group flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-sm text-blue-900">{tpl.name}</h5>
                              {DEFAULT_TEMPLATES.some(def => def.id === tpl.id) && (
                                <Badge variant="outline" className="text-[8px] uppercase px-1">Padrão</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingTemplate(tpl)}>
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              {!DEFAULT_TEMPLATES.some(def => def.id === tpl.id) && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir Modelo?</AlertDialogTitle>
                                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteTemplate(tpl.id)}>Confirmar</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-3 italic mb-2">{tpl.body}</p>
                        </div>
                        <div className="flex gap-1 flex-wrap pt-2 border-t mt-2">
                           {tpl.body.match(/{{[a-z_]+}}/g)?.map(tag => (
                             <span key={tag} className="text-[8px] bg-muted px-1 rounded font-mono">{tag}</span>
                           ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-10 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                      Nenhum modelo cadastrado. Clique em "Novo Modelo" para começar.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca" className="space-y-6 pt-4">
          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-amber-600" />
                Segurança e Backup de Dados
              </CardTitle>
              <CardDescription>
                Exporte todos os cadastros e histórico financeiro para um arquivo local ou restaure dados de um backup anterior.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white rounded-lg border shadow-sm">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-bold">Gerar Backup Completo</p>
                  <p className="text-xs text-muted-foreground">Baixa um arquivo .json com todas as informações da escola.</p>
                </div>
                <Button 
                  onClick={handleBackup} 
                  disabled={isBackingUp}
                  className="w-full sm:w-auto"
                >
                  {isBackingUp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                  Baixar Dados
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white rounded-lg border shadow-sm">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-bold">Restaurar de Arquivo</p>
                  <p className="text-xs text-muted-foreground">Carrega dados de um arquivo de backup para o servidor.</p>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto border-amber-300 text-amber-700 hover:bg-amber-50">
                      <Upload className="h-4 w-4 mr-2" />
                      Carregar Backup
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-destructive" />
                        Atenção: Operação Crítica
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <p>
                          Ao restaurar dados, informações existentes no servidor serão <strong>sobrescritas</strong> ou complementadas pelos dados do arquivo.
                        </p>
                        <p className="font-bold text-destructive">
                          Esta ação pode causar duplicidade ou perda de dados recentes caso o arquivo esteja desatualizado.
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <div className="relative">
                        <Input
                          type="file"
                          accept=".json"
                          onChange={handleRestore}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          disabled={isRestoring}
                        />
                        <Button disabled={isRestoring}>
                          {isRestoring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Selecionar Arquivo e Confirmar"}
                        </Button>
                      </div>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-blue-600" />
                Documentação de Dados
              </CardTitle>
              <CardDescription>Estrutura de coleções monitoradas pelo backup.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {collectionsToBackup.map(col => (
                  <div key={col} className="text-[10px] uppercase font-mono bg-muted p-2 rounded border">
                    {col}
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-100 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong>Dica de Segurança:</strong> Recomendamos realizar o backup semanalmente e armazenar o arquivo em um local seguro (nuvem ou HD externo).
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
