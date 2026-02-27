
"use client";

import { useState } from "react";
import { useFirestore } from "@/firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, ShieldAlert, Loader2, Database, FileJson, AlertTriangle } from "lucide-react";
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
  'attendance'
];

export default function ConfiguracoesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

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
                // Using setDoc directly for restoration to maintain IDs
                await setDoc(doc(firestore, colName, id), payload, { merge: true });
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
        // Reset file input
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações do Sistema</h1>
        <p className="text-muted-foreground">Gerencie a segurança dos dados e parâmetros globais do aplicativo.</p>
      </div>

      <div className="grid gap-6">
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
                <strong>Dica de Segurança:</strong> Recomendamos realizar o backup semanalmente e armazenar o arquivo em um local seguro (nuvem ou HD externo). Este arquivo contém informações sensíveis de alunos e dados financeiros.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
