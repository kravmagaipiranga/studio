
"use client";

import { useState, useMemo, useEffect } from "react";
import { collection, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { Expense, ExpenseCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Download, PlusCircle, Search, Trash2, Pencil, Receipt, TrendingDown, Filter, X,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: ExpenseCategory[] = [
  "Aluguel", "Água", "Energia", "Internet", "Salários", "Marketing",
  "Equipamentos", "Manutenção", "Contabilidade", "Impostos", "Outros",
];

const PAYMENT_METHODS = [
  "Pix", "Dinheiro", "Boleto", "Cartão de Crédito", "Cartão de Débito", "Transferência", "Outros",
] as const;

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Aluguel:       "bg-violet-100 text-violet-800 border-violet-200",
  Água:          "bg-blue-100 text-blue-800 border-blue-200",
  Energia:       "bg-yellow-100 text-yellow-800 border-yellow-200",
  Internet:      "bg-cyan-100 text-cyan-800 border-cyan-200",
  Salários:      "bg-emerald-100 text-emerald-800 border-emerald-200",
  Marketing:     "bg-pink-100 text-pink-800 border-pink-200",
  Equipamentos:  "bg-orange-100 text-orange-800 border-orange-200",
  Manutenção:    "bg-amber-100 text-amber-800 border-amber-200",
  Contabilidade: "bg-slate-100 text-slate-800 border-slate-200",
  Impostos:      "bg-red-100 text-red-800 border-red-200",
  Outros:        "bg-gray-100 text-gray-700 border-gray-200",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function competenciaLabel(yyyyMM: string) {
  if (!yyyyMM || yyyyMM.length < 7) return yyyyMM;
  try {
    const [y, m] = yyyyMM.split("-");
    const d = new Date(Number(y), Number(m) - 1, 1);
    return format(d, "MMMM/yyyy", { locale: ptBR })
      .replace(/^\w/, c => c.toUpperCase());
  } catch { return yyyyMM; }
}

function buildCompetenciaOptions() {
  const now = new Date();
  const opts: string[] = [];
  for (let i = -12; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    opts.push(format(d, "yyyy-MM"));
  }
  return opts;
}

const COMPETENCIA_OPTIONS = buildCompetenciaOptions();

// ── Empty form ────────────────────────────────────────────────────────────────

function emptyForm(): Omit<Expense, "id" | "createdAt"> {
  return {
    date: format(new Date(), "yyyy-MM-dd"),
    category: "Outros",
    description: "",
    supplier: "",
    paymentMethod: "Pix",
    amount: 0,
    competencia: format(new Date(), "yyyy-MM"),
  };
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DespesasPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  // ── Filters ────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]         = useState("");
  const [filterCategory, setFilterCategory]   = useState<ExpenseCategory | "Todas">("Todas");
  const [filterDateFrom, setFilterDateFrom]   = useState("");
  const [filterDateTo, setFilterDateTo]       = useState("");
  const [filterCompetencia, setFilterCompetencia] = useState<string>("Todas");

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen]           = useState(false);
  const [editingExpense, setEditingExpense]   = useState<Expense | null>(null);
  const [form, setForm]                       = useState(emptyForm());
  const [isSaving, setIsSaving]               = useState(false);

  // ── Delete dialog ──────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget]       = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting]           = useState(false);

  // ── Firestore ──────────────────────────────────────────────────────────────
  const expensesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "expenses"), orderBy("date", "desc"));
  }, [firestore]);

  const { data: expenses, isLoading } = useCollection<Expense>(expensesQuery);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(e => {
      if (filterCategory !== "Todas" && e.category !== filterCategory) return false;
      if (filterCompetencia !== "Todas" && e.competencia !== filterCompetencia) return false;
      if (filterDateFrom && e.date < filterDateFrom) return false;
      if (filterDateTo && e.date > filterDateTo) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !e.description.toLowerCase().includes(q) &&
          !e.supplier.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [expenses, filterCategory, filterCompetencia, filterDateFrom, filterDateTo, searchQuery]);

  // ── Summary ────────────────────────────────────────────────────────────────
  const { totalFiltered, totalThisMonth, byCategory } = useMemo(() => {
    const totalFiltered = filtered.reduce((s, e) => s + (e.amount || 0), 0);

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd   = endOfMonth(now);
    const totalThisMonth = (expenses || [])
      .filter(e => {
        try { return isWithinInterval(parseISO(e.date), { start: monthStart, end: monthEnd }); }
        catch { return false; }
      })
      .reduce((s, e) => s + (e.amount || 0), 0);

    const byCategory: Record<string, number> = {};
    filtered.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + (e.amount || 0);
    });

    return { totalFiltered, totalThisMonth, byCategory };
  }, [filtered, expenses]);

  // ── Open dialog ────────────────────────────────────────────────────────────
  const openNew = () => {
    setEditingExpense(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setForm({
      date: expense.date,
      category: expense.category,
      description: expense.description,
      supplier: expense.supplier,
      paymentMethod: expense.paymentMethod,
      amount: expense.amount,
      competencia: expense.competencia,
    });
    setDialogOpen(true);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!firestore) return;
    if (!form.description.trim()) {
      toast({ variant: "destructive", title: "Descrição obrigatória" });
      return;
    }
    if (!form.amount || form.amount <= 0) {
      toast({ variant: "destructive", title: "Informe um valor válido" });
      return;
    }

    setIsSaving(true);
    try {
      if (editingExpense) {
        await updateDoc(doc(firestore, "expenses", editingExpense.id), { ...form });
        toast({ title: "Despesa atualizada" });
      } else {
        await addDoc(collection(firestore, "expenses"), {
          ...form,
          createdAt: new Date().toISOString(),
        });
        toast({ title: "Despesa registrada" });
      }
      setDialogOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: String(err) });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!firestore || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(firestore, "expenses", deleteTarget.id));
      toast({ title: "Despesa excluída" });
      setDeleteTarget(null);
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao excluir", description: String(err) });
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Export CSV ─────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (filtered.length === 0) {
      toast({ variant: "destructive", title: "Nenhum registro para exportar" });
      return;
    }
    const esc = (v: any) => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ["Data", "Competência", "Categoria", "Descrição", "Aluno/Fornecedor", "Forma de Pagamento", "Valor (R$)"];
    const rows = filtered.map(e => [
      e.date,
      competenciaLabel(e.competencia),
      e.category,
      e.description,
      e.supplier,
      e.paymentMethod,
      String(e.amount).replace(".", ","),
    ].map(esc).join(","));

    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "despesas.csv"; a.style.visibility = "hidden";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast({ title: "Exportação concluída", description: `${filtered.length} registros exportados.` });
  };

  const hasActiveFilters =
    filterCategory !== "Todas" || filterCompetencia !== "Todas" || filterDateFrom || filterDateTo || searchQuery;

  const clearFilters = () => {
    setFilterCategory("Todas");
    setFilterCompetencia("Todas");
    setFilterDateFrom("");
    setFilterDateTo("");
    setSearchQuery("");
  };

  // ── Unique competências present in data ────────────────────────────────────
  const competenciasInData = useMemo(() => {
    const set = new Set((expenses || []).map(e => e.competencia).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [expenses]);

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Despesas</h1>
          <p className="text-muted-foreground text-sm">Registro e controle de saídas financeiras.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
          <Button size="sm" onClick={openNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Nova Despesa
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Total no mês atual</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {isLoading ? <Skeleton className="h-8 w-28" /> : formatCurrency(totalThisMonth)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Total filtrado</CardTitle>
            <Receipt className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {isLoading ? <Skeleton className="h-8 w-28" /> : formatCurrency(totalFiltered)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{filtered.length} registro(s)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Filtros</CardTitle>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground h-7 px-2">
                <X className="h-3 w-3 mr-1" /> Limpar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Descrição ou fornecedor..."
                className="pl-8"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category */}
            <Select value={filterCategory} onValueChange={v => setFilterCategory(v as ExpenseCategory | "Todas")}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas as categorias</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Competência */}
            <Select value={filterCompetencia} onValueChange={setFilterCompetencia}>
              <SelectTrigger>
                <SelectValue placeholder="Competência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas as competências</SelectItem>
                {competenciasInData.map(c => (
                  <SelectItem key={c} value={c}>{competenciaLabel(c)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date range */}
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                className="text-sm"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                placeholder="De"
                title="Data inicial"
              />
              <span className="text-muted-foreground text-xs">—</span>
              <Input
                type="date"
                className="text-sm"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                placeholder="Até"
                title="Data final"
              />
            </div>
          </div>

          {/* Category breakdown (when filtered) */}
          {Object.keys(byCategory).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
              {Object.entries(byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, val]) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat === filterCategory ? "Todas" : cat as ExpenseCategory)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all",
                      CATEGORY_COLORS[cat as ExpenseCategory] || "bg-gray-100 text-gray-700",
                      cat === filterCategory && "ring-2 ring-offset-1 ring-current"
                    )}
                  >
                    {cat} · {formatCurrency(val)}
                  </button>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Data</TableHead>
                <TableHead className="w-32">Competência</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Aluno / Fornecedor</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right w-32">Valor</TableHead>
                <TableHead className="w-20"><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
              {!isLoading && filtered.map(expense => (
                <TableRow key={expense.id}>
                  <TableCell className="text-sm">
                    {(() => {
                      try { return format(parseISO(expense.date), "dd/MM/yyyy"); }
                      catch { return expense.date; }
                    })()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {competenciaLabel(expense.competencia)}
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                      CATEGORY_COLORS[expense.category] || "bg-gray-100 text-gray-700"
                    )}>
                      {expense.category}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">{expense.description}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">{expense.supplier}</TableCell>
                  <TableCell className="text-sm">{expense.paymentMethod}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums">
                    <span className="text-red-700">{formatCurrency(expense.amount)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(expense)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteTarget(expense)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Receipt className="h-8 w-8 opacity-30" />
              <p className="text-sm">Nenhuma despesa encontrada para os filtros selecionados.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Add / Edit Dialog ──────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
            <DialogDescription>
              {editingExpense ? "Altere os dados abaixo e salve." : "Preencha os dados da despesa."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Row: Data + Competência */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Competência *</Label>
                <Select value={form.competencia} onValueChange={v => setForm(f => ({ ...f, competencia: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPETENCIA_OPTIONS.map(c => (
                      <SelectItem key={c} value={c}>{competenciaLabel(c)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Categoria */}
            <div className="space-y-1.5">
              <Label>Categoria *</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as ExpenseCategory }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <Label>Descrição *</Label>
              <Input
                placeholder="Ex: Aluguel do imóvel — junho"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Aluno/Fornecedor */}
            <div className="space-y-1.5">
              <Label>Aluno / Fornecedor</Label>
              <Input
                placeholder="Nome do fornecedor ou aluno"
                value={form.supplier}
                onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
              />
            </div>

            {/* Row: Forma de Pagamento + Valor */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Forma de Pagamento *</Label>
                <Select value={form.paymentMethod} onValueChange={v => setForm(f => ({ ...f, paymentMethod: v as Expense["paymentMethod"] }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.amount || ""}
                  onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : editingExpense ? "Salvar alterações" : "Registrar despesa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.description}</strong> — {deleteTarget && formatCurrency(deleteTarget.amount)}<br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
