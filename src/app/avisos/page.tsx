'use client';

import { useState } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Notice } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Megaphone, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PRIORITY_STYLES: Record<Notice['priority'], { badge: string; card: string; label: string }> = {
  normal:     { badge: 'bg-slate-100 text-slate-700 border-slate-200',     card: 'border-slate-200',     label: 'Normal' },
  importante: { badge: 'bg-amber-100 text-amber-800 border-amber-200',     card: 'border-amber-300',     label: 'Importante' },
  urgente:    { badge: 'bg-red-100 text-red-800 border-red-300',            card: 'border-red-400',       label: 'Urgente' },
};

type FormState = {
  title: string;
  content: string;
  priority: Notice['priority'];
  active: boolean;
};

const EMPTY_FORM: FormState = { title: '', content: '', priority: 'normal', active: true };

export default function AvisosPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const noticesRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'notices');
  }, [firestore]);

  const { data: notices, isLoading } = useCollection<Notice>(noticesRef);

  const sorted = [...(notices ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Notice | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(notice: Notice) {
    setEditing(notice);
    setForm({
      title: notice.title,
      content: notice.content,
      priority: notice.priority,
      active: notice.active,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!firestore || !form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (editing) {
        await updateDoc(doc(firestore, 'notices', editing.id), {
          ...form,
          updatedAt: now,
        });
        toast({ title: 'Aviso atualizado com sucesso.' });
      } else {
        await addDoc(collection(firestore, 'notices'), {
          ...form,
          createdAt: now,
          updatedAt: now,
        });
        toast({ title: 'Aviso criado com sucesso.' });
      }
      setDialogOpen(false);
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao salvar aviso.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(notice: Notice) {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'notices', notice.id));
      toast({ title: 'Aviso excluído.' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao excluir aviso.' });
    } finally {
      setDeleteTarget(null);
    }
  }

  async function toggleActive(notice: Notice) {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'notices', notice.id), {
        active: !notice.active,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao atualizar aviso.' });
    }
  }

  function formatDate(iso: string) {
    try {
      return format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return iso;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Avisos</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie os comunicados exibidos no Portal do Aluno.
            </p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Novo Aviso
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
          <Megaphone className="h-12 w-12 opacity-30" />
          <p className="text-lg font-medium">Nenhum aviso cadastrado</p>
          <p className="text-sm">Crie o primeiro aviso para os alunos.</p>
          <Button variant="outline" onClick={openCreate} className="mt-2">
            <Plus className="mr-2 h-4 w-4" /> Criar aviso
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((notice) => {
            const style = PRIORITY_STYLES[notice.priority] ?? PRIORITY_STYLES.normal;
            return (
              <Card key={notice.id} className={cn('flex flex-col border-l-4', style.card, !notice.active && 'opacity-60')}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{notice.title}</CardTitle>
                    <Badge variant="outline" className={cn('shrink-0 text-xs', style.badge)}>
                      {style.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(notice.createdAt)}</p>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                    {notice.content}
                  </p>
                </CardContent>
                <CardFooter className="flex items-center justify-between pt-3 border-t gap-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={notice.active}
                      onCheckedChange={() => toggleActive(notice)}
                      id={`active-${notice.id}`}
                    />
                    <Label htmlFor={`active-${notice.id}`} className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                      {notice.active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {notice.active ? 'Visível' : 'Oculto'}
                    </Label>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(notice)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(notice)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Aviso' : 'Novo Aviso'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="notice-title">Título</Label>
              <Input
                id="notice-title"
                placeholder="Ex: Treino cancelado nesta semana"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notice-content">Conteúdo</Label>
              <Textarea
                id="notice-content"
                placeholder="Escreva o aviso completo aqui..."
                rows={5}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1 space-y-1.5">
                <Label>Prioridade</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Notice['priority'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="importante">Importante</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Visibilidade</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={form.active}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
                    id="form-active"
                  />
                  <Label htmlFor="form-active" className="text-sm cursor-pointer">
                    {form.active ? 'Visível para alunos' : 'Oculto'}
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={saving}>Cancelar</Button>
            </DialogClose>
            <Button
              onClick={handleSave}
              disabled={saving || !form.title.trim() || !form.content.trim()}
            >
              {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar aviso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aviso?</AlertDialogTitle>
            <AlertDialogDescription>
              O aviso <strong>"{deleteTarget?.title}"</strong> será excluído permanentemente e não poderá ser recuperado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
