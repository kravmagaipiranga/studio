'use client';

import { useState, useMemo } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Product, StoreOrder } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ShoppingBag, Plus, Pencil, Trash2, Eye, EyeOff, Package, ClipboardList, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_STYLES: Record<StoreOrder['status'], { label: string; badge: string }> = {
  pendente:   { label: 'Pendente',   badge: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  confirmado: { label: 'Confirmado', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  entregue:   { label: 'Entregue',   badge: 'bg-green-100 text-green-800 border-green-200' },
  cancelado:  { label: 'Cancelado',  badge: 'bg-red-100 text-red-800 border-red-200' },
};

const STATUS_NEXT: Record<StoreOrder['status'], StoreOrder['status'] | null> = {
  pendente:   'confirmado',
  confirmado: 'entregue',
  entregue:   null,
  cancelado:  null,
};

type ProductForm = {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
  active: boolean;
  variations: string[];
  newVariation: string;
};

const EMPTY_FORM: ProductForm = {
  name: '', description: '', price: '', imageUrl: '', category: '',
  active: true, variations: [], newVariation: '',
};

function formatDate(iso: string) {
  try { return format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }); }
  catch { return iso; }
}

export default function LojaAdminPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'produtos' | 'pedidos'>('produtos');

  const productsRef = useMemoFirebase(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  const { data: products, isLoading: isProductsLoading } = useCollection<Product>(productsRef);
  const sortedProducts = useMemo(
    () => [...(products ?? [])].sort((a, b) =>
      (a.category ?? '').localeCompare(b.category ?? '', 'pt-BR') ||
      a.name.localeCompare(b.name, 'pt-BR')
    ),
    [products]
  );

  const ordersRef = useMemoFirebase(() => firestore ? collection(firestore, 'pedidos') : null, [firestore]);
  const { data: orders, isLoading: isOrdersLoading } = useCollection<StoreOrder>(ordersRef);
  const sortedOrders = useMemo(
    () => [...(orders ?? [])].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    [orders]
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      imageUrl: p.imageUrl ?? '',
      category: p.category,
      active: p.active,
      variations: p.variations ?? [],
      newVariation: '',
    });
    setDialogOpen(true);
  }

  function addVariation() {
    const v = form.newVariation.trim();
    if (!v || form.variations.includes(v)) return;
    setForm(f => ({ ...f, variations: [...f.variations, v], newVariation: '' }));
  }

  function removeVariation(v: string) {
    setForm(f => ({ ...f, variations: f.variations.filter(x => x !== v) }));
  }

  async function handleSave() {
    if (!firestore || !form.name.trim() || !form.price) return;
    const price = parseFloat(form.price.replace(',', '.'));
    if (isNaN(price) || price < 0) {
      toast({ variant: 'destructive', title: 'Preço inválido.' });
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const data = {
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        imageUrl: form.imageUrl.trim(),
        category: form.category.trim(),
        active: form.active,
        variations: form.variations,
      };
      if (editing) {
        await updateDoc(doc(firestore, 'products', editing.id), { ...data, updatedAt: now });
        toast({ title: 'Produto atualizado.' });
      } else {
        await addDoc(collection(firestore, 'products'), { ...data, createdAt: now, updatedAt: now });
        toast({ title: 'Produto criado.' });
      }
      setDialogOpen(false);
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao salvar produto.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Product) {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'products', p.id));
      toast({ title: 'Produto excluído.' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao excluir.' });
    } finally {
      setDeleteTarget(null);
    }
  }

  async function toggleActive(p: Product) {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'products', p.id), {
        active: !p.active,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao atualizar produto.' });
    }
  }

  async function advanceStatus(order: StoreOrder) {
    if (!firestore) return;
    const next = STATUS_NEXT[order.status];
    if (!next) return;
    try {
      await updateDoc(doc(firestore, 'pedidos', order.id), {
        status: next,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao atualizar pedido.' });
    }
  }

  async function cancelOrder(order: StoreOrder) {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'pedidos', order.id), {
        status: 'cancelado',
        updatedAt: new Date().toISOString(),
      });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao cancelar pedido.' });
    }
  }

  const pendingCount = orders?.filter(o => o.status === 'pendente').length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-6 w-6 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Loja</h1>
            <p className="text-sm text-muted-foreground">Gerencie produtos e pedidos dos alunos.</p>
          </div>
        </div>
        {activeTab === 'produtos' && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Novo Produto
          </Button>
        )}
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('produtos')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'produtos'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Package className="h-4 w-4" /> Produtos
          <span className="ml-1 text-xs text-muted-foreground">({sortedProducts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('pedidos')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'pedidos'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <ClipboardList className="h-4 w-4" /> Pedidos
          {pendingCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* ── PRODUTOS TAB ── */}
      {activeTab === 'produtos' && (
        isProductsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-56 rounded-xl" />)}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
            <Package className="h-12 w-12 opacity-30" />
            <p className="text-lg font-medium">Nenhum produto cadastrado</p>
            <Button variant="outline" onClick={openCreate} className="mt-2">
              <Plus className="mr-2 h-4 w-4" /> Criar produto
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedProducts.map((p) => (
              <Card key={p.id} className={cn('flex flex-col', !p.active && 'opacity-60')}>
                {p.imageUrl && (
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
                <CardHeader className="pb-1 pt-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{p.name}</CardTitle>
                    <Badge variant="outline" className="shrink-0 text-xs text-muted-foreground">
                      {p.category || '—'}
                    </Badge>
                  </div>
                  <p className="text-lg font-bold text-primary">
                    R$ {Number(p.price).toFixed(2).replace('.', ',')}
                  </p>
                </CardHeader>
                <CardContent className="flex-1 pb-2 space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                  {p.variations && p.variations.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.variations.map(v => (
                        <Badge key={v} variant="secondary" className="text-xs px-2 py-0.5">
                          {v}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex items-center justify-between pt-3 border-t gap-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={p.active}
                      onCheckedChange={() => toggleActive(p)}
                      id={`active-${p.id}`}
                    />
                    <Label htmlFor={`active-${p.id}`} className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                      {p.active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {p.active ? 'Visível' : 'Oculto'}
                    </Label>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(p)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )
      )}

      {/* ── PEDIDOS TAB ── */}
      {activeTab === 'pedidos' && (
        isOrdersLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : sortedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
            <ClipboardList className="h-12 w-12 opacity-30" />
            <p className="text-lg font-medium">Nenhum pedido ainda</p>
            <p className="text-sm">Os pedidos dos alunos aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedOrders.map((order) => {
              const style = STATUS_STYLES[order.status] ?? STATUS_STYLES.pendente;
              const nextStatus = STATUS_NEXT[order.status];
              return (
                <Card key={order.id} className={cn(order.status === 'cancelado' && 'opacity-60')}>
                  <CardHeader className="pb-2 pt-4">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold">{order.studentName}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn('text-xs', style.badge)}>
                          {style.label}
                        </Badge>
                        <p className="font-bold text-primary">
                          R$ {Number(order.total).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <ul className="text-sm space-y-0.5">
                      {order.items.map((item, i) => (
                        <li key={i} className="flex justify-between text-muted-foreground">
                          <span>
                            {item.quantity}× {item.name}
                            {item.variation && (
                              <Badge variant="outline" className="ml-1.5 text-[10px] px-1.5 py-0">
                                {item.variation}
                              </Badge>
                            )}
                          </span>
                          <span>R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                        </li>
                      ))}
                    </ul>
                    {order.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">Obs: {order.notes}</p>
                    )}
                  </CardContent>
                  {(nextStatus || order.status === 'pendente' || order.status === 'confirmado') && (
                    <CardFooter className="border-t pt-3 gap-2 flex-wrap">
                      {nextStatus && (
                        <Button size="sm" onClick={() => advanceStatus(order)}>
                          Marcar como {STATUS_STYLES[nextStatus].label}
                        </Button>
                      )}
                      {(order.status === 'pendente' || order.status === 'confirmado') && (
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => cancelOrder(order)}>
                          Cancelar pedido
                        </Button>
                      )}
                    </CardFooter>
                  )}
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            <DialogDescription>
              Preencha os dados do produto. Variações são opcionais (tamanhos, cores, etc.).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="p-name">Nome do produto</Label>
                <Input id="p-name" placeholder="Ex: Kimono Branco" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-price">Preço (R$)</Label>
                <Input id="p-price" placeholder="0,00" value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-category">Categoria</Label>
                <Input id="p-category" placeholder="Ex: Uniforme" value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="p-desc">Descrição</Label>
                <Textarea id="p-desc" placeholder="Descreva o produto..." rows={3} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="p-img">URL da imagem (opcional)</Label>
                <Input id="p-img" placeholder="https://..." value={form.imageUrl}
                  onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} />
              </div>

              {/* Variations */}
              <div className="col-span-2 space-y-2">
                <Label>Variações (opcional)</Label>
                <p className="text-xs text-muted-foreground -mt-1">
                  Ex: tamanhos (P, M, G, GG) ou cores (Preto, Branco). O aluno escolherá uma ao comprar.
                </p>
                {form.variations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.variations.map(v => (
                      <span key={v} className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-md font-medium">
                        {v}
                        <button
                          type="button"
                          onClick={() => removeVariation(v)}
                          className="hover:text-destructive transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: G ou Azul"
                    value={form.newVariation}
                    onChange={e => setForm(f => ({ ...f, newVariation: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addVariation(); } }}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addVariation}
                    disabled={!form.newVariation.trim()}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </div>
              </div>

              <div className="col-span-2 flex items-center gap-3">
                <Switch id="p-active" checked={form.active}
                  onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
                <Label htmlFor="p-active" className="cursor-pointer">
                  {form.active ? 'Visível para alunos' : 'Oculto'}
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={saving}>Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.price}>
              {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar produto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              O produto <strong>"{deleteTarget?.name}"</strong> será excluído permanentemente.
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
