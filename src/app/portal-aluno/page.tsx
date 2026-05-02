'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import {
  Student, Payment, Attendance, Exam, HandbookContent, Notice, Product, StoreOrderItem,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  LogOut, User, CreditCard, CalendarCheck, GraduationCap, ShieldAlert,
  Coins, BookOpen, Home, Megaphone, ShoppingBag, Minus, Plus, ShoppingCart,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StudentPortalForm } from '@/components/students/student-portal-form';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const beltStyles: Record<string, { bg: string; text: string }> = {
  branca:  { bg: 'bg-white border border-gray-300', text: 'text-gray-800' },
  amarela: { bg: 'bg-yellow-400', text: 'text-yellow-900' },
  laranja: { bg: 'bg-orange-500', text: 'text-white' },
  verde:   { bg: 'bg-green-600', text: 'text-white' },
  azul:    { bg: 'bg-blue-600', text: 'text-white' },
  marrom:  { bg: 'bg-amber-800', text: 'text-white' },
  preta:   { bg: 'bg-gray-900', text: 'text-white' },
};

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    try {
      return format(new Date(dateStr + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateStr;
    }
  }
}

function getInitials(name: string) {
  if (!name) return '?';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Tab = 'pagamentos' | 'presencas' | 'exames' | 'curriculo' | 'loja' | 'perfil';

const NAV_ITEMS: { value: Tab; icon: React.ElementType; label: string }[] = [
  { value: 'pagamentos', icon: CreditCard,     label: 'Pgtos' },
  { value: 'presencas',  icon: CalendarCheck,  label: 'Pres.' },
  { value: 'exames',     icon: GraduationCap,  label: 'Exames' },
  { value: 'curriculo',  icon: BookOpen,       label: 'Currículo' },
  { value: 'loja',       icon: ShoppingBag,    label: 'Loja' },
];

export default function StudentPortalPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('pagamentos');

  // ── Student ──────────────────────────────────────────────────────────────
  const studentQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'students'), where('userId', '==', user.uid));
  }, [firestore, user]);
  const { data: studentData, isLoading: isStudentLoading } = useCollection<Student>(studentQuery);
  const student = useMemo(() => studentData?.[0], [studentData]);

  // ── Payments ─────────────────────────────────────────────────────────────
  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore || !student) return null;
    return query(collection(firestore, 'payments'), where('studentId', '==', student.id), orderBy('paymentDate', 'desc'));
  }, [firestore, student]);
  const { data: payments, isLoading: isPaymentsLoading } = useCollection<Payment>(paymentsQuery);

  // ── Attendance ────────────────────────────────────────────────────────────
  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore || !student) return null;
    return query(collection(firestore, 'attendance'), where('studentId', '==', student.id), orderBy('date', 'desc'), limit(100));
  }, [firestore, student]);
  const { data: attendance, isLoading: isAttendanceLoading } = useCollection<Attendance>(attendanceQuery);

  // ── Exams ─────────────────────────────────────────────────────────────────
  const examsQuery = useMemoFirebase(() => {
    if (!firestore || !student) return null;
    return query(collection(firestore, 'exams'), where('studentId', '==', student.id), orderBy('examDate', 'desc'));
  }, [firestore, student]);
  const { data: exams, isLoading: isExamsLoading } = useCollection<Exam>(examsQuery);

  // ── Notices ───────────────────────────────────────────────────────────────
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isNoticesLoading, setIsNoticesLoading] = useState(true);
  useEffect(() => {
    setIsNoticesLoading(true);
    fetch('/api/notices')
      .then(r => r.json())
      .then(data => setNotices(data.notices ?? []))
      .catch(() => setNotices([]))
      .finally(() => setIsNoticesLoading(false));
  }, []);

  // ── Handbook ──────────────────────────────────────────────────────────────
  const handbookQuery = useMemoFirebase(() => {
    if (!firestore || !student) return null;
    const beltId = student.belt?.toLowerCase() ?? 'branca';
    return query(collection(firestore, 'handbook'), where('id', '==', beltId));
  }, [firestore, student]);
  const { data: handbookData, isLoading: isHandbookLoading } = useCollection<HandbookContent>(handbookQuery);
  const handbook = useMemo(() => handbookData?.[0], [handbookData]);

  // ── Products / Shop ───────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [orderNotes, setOrderNotes] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);

  useEffect(() => {
    setIsProductsLoading(true);
    setProductsError('');
    fetch('/api/products')
      .then(r => r.json())
      .then(data => {
        if (data.error) setProductsError(data.error);
        setProducts(data.products ?? []);
      })
      .catch(e => {
        setProductsError(e.message);
        setProducts([]);
      })
      .finally(() => setIsProductsLoading(false));
  }, []);

  const cartItems = useMemo<StoreOrderItem[]>(() =>
    Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const p = products.find(p => p.id === id)!;
        return { productId: id, name: p.name, price: p.price, quantity: qty, variation: selectedVariations[id] };
      }),
    [cart, products, selectedVariations]
  );

  const cartTotal = useMemo(() =>
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  function updateQty(productId: string, delta: number) {
    setCart(prev => {
      const next = Math.max(0, (prev[productId] ?? 0) + delta);
      return { ...prev, [productId]: next };
    });
  }

  function selectVariation(productId: string, variation: string) {
    setSelectedVariations(prev => ({ ...prev, [productId]: variation }));
  }

  async function handleOrder() {
    if (!student || !user || cartItems.length === 0) return;
    setIsOrdering(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ studentId: student.id, studentName: student.name, items: cartItems, notes: orderNotes }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Pedido realizado!', description: 'A academia receberá seu pedido em breve.' });
        setCart({});
        setOrderNotes('');
      } else {
        throw new Error(data.error || 'Erro ao fazer pedido.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Erro ao fazer pedido', description: msg });
    } finally {
      setIsOrdering(false);
    }
  }

  // ── Auth redirect ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isUserLoading && !user) router.push('/login-aluno');
  }, [isUserLoading, user, router]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      toast({ title: 'Você saiu com sucesso.' });
      router.push('/login-aluno');
    }
  };

  // ── Loading / error states ────────────────────────────────────────────────
  if (isUserLoading || isStudentLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <div className="space-y-4 w-full max-w-lg p-6">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              <CardTitle>Perfil Não Encontrado</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Não encontramos um perfil de aluno associado a este login. Entre em contato com a administração.
            </p>
            <Button onClick={handleLogout} variant="destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const beltKey = student.belt?.toLowerCase() ?? 'branca';
  const beltStyle = beltStyles[beltKey] ?? beltStyles.branca;
  const lastPayment = payments?.[0];
  const credits = typeof student.paymentCredits === 'number' ? student.paymentCredits : 0;

  return (
    <div className="min-h-screen bg-muted/40 pb-20">

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <header className="bg-background border-b sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold leading-tight">
              Krav Magá IPIRANGA
            </p>
            <h1 className="text-base font-bold leading-tight truncate">Portal do Aluno</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant={activeTab === 'perfil' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('perfil')}
              className="gap-1.5"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </Button>
            <Button onClick={handleLogout} variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* ── Student Hero Card ──────────────────────────────────────────── */}
        {activeTab !== 'perfil' && (
          <Card className="overflow-hidden">
            <div className="bg-primary/5 border-b px-4 py-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0',
                  beltStyle.bg, beltStyle.text
                )}>
                  {getInitials(student.name)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold truncate">{student.name}</h2>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className={cn(
                      'text-xs font-bold px-2 py-0.5 rounded-full capitalize',
                      beltStyle.bg, beltStyle.text
                    )}>
                      Faixa {student.belt}
                    </span>
                    <Badge variant={student.status === 'Ativo' ? 'default' : student.status === 'Inativo' ? 'secondary' : 'destructive'} className="text-xs">
                      {student.status}
                    </Badge>
                    {student.paymentStatus && (
                      <Badge
                        variant={student.paymentStatus === 'Pago' ? 'outline' : 'destructive'}
                        className={cn('text-xs', student.paymentStatus === 'Pago' ? 'border-green-500 text-green-700' : '')}
                      >
                        {student.paymentStatus}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y">
              <div className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Plano</p>
                <p className="text-sm font-bold mt-0.5">{student.planType || '—'}</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Validade</p>
                <p className="text-sm font-bold mt-0.5">
                  {formatDate(lastPayment?.expirationDate ?? student.planExpirationDate)}
                </p>
              </div>
              <div className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Últ. Pgto</p>
                <p className="text-sm font-bold mt-0.5">
                  {formatDate(lastPayment?.paymentDate ?? student.lastPaymentDate)}
                </p>
              </div>
              <div className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide flex items-center justify-center gap-1">
                  <Coins className="h-3 w-3" /> Créditos
                </p>
                <p className={cn('text-sm font-bold mt-0.5', credits > 0 ? 'text-green-600' : '')}>
                  {credits > 0 ? `R$ ${credits.toFixed(2)}` : '—'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* ── AVISOS (sempre visíveis) ────────────────────────────────────── */}
        {activeTab !== 'perfil' && (
          isNoticesLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : notices.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Megaphone className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Avisos da Academia</h2>
                <span className="ml-auto text-[10px] bg-primary text-primary-foreground font-bold px-1.5 py-0.5 rounded-full">
                  {notices.length}
                </span>
              </div>
              {notices.map(notice => {
                const ps = {
                  normal:     { border: 'border-l-slate-400', bg: 'bg-slate-50',  badge: 'bg-slate-100 text-slate-700',  label: 'Normal' },
                  importante: { border: 'border-l-amber-400', bg: 'bg-amber-50',  badge: 'bg-amber-100 text-amber-800',  label: 'Importante' },
                  urgente:    { border: 'border-l-red-500',   bg: 'bg-red-50',    badge: 'bg-red-100 text-red-800',      label: 'Urgente' },
                }[notice.priority] ?? { border: 'border-l-slate-400', bg: 'bg-slate-50', badge: 'bg-slate-100 text-slate-700', label: 'Normal' };
                return (
                  <Card key={notice.id} className={cn('border-l-4', ps.border, ps.bg)}>
                    <CardHeader className="pb-1 pt-3 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm leading-snug">{notice.title}</CardTitle>
                        {notice.priority !== 'normal' && (
                          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0', ps.badge)}>
                            {ps.label}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notice.content}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : null
        )}

        {/* ── PERFIL ─────────────────────────────────────────────────────── */}
        {activeTab === 'perfil' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <User className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Meu Perfil</h2>
            </div>
            <StudentPortalForm student={student} />
          </div>
        )}

        {/* ── PAGAMENTOS ──────────────────────────────────────────────────── */}
        {activeTab === 'pagamentos' && (
          <Card>
            <CardHeader className="px-4 pb-2">
              <CardTitle className="text-base">Histórico de Pagamentos</CardTitle>
              <CardDescription className="text-xs">Todos os pagamentos registrados.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isPaymentsLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
                </div>
              ) : payments && payments.length > 0 ? (
                <div className="divide-y">
                  {payments.map(p => (
                    <div key={p.id} className="flex items-start justify-between gap-3 px-4 py-3.5">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{p.planType}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(p.paymentDate)} · {p.paymentMethod}
                        </p>
                        {p.expirationDate && (
                          <p className="text-xs text-muted-foreground">
                            Válido até {formatDate(p.expirationDate)}
                          </p>
                        )}
                      </div>
                      <p className="font-bold text-green-700 text-sm shrink-0">
                        R$ {Number(p.amount).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-sm text-muted-foreground italic">
                  Nenhum pagamento encontrado.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── PRESENÇAS ───────────────────────────────────────────────────── */}
        {activeTab === 'presencas' && (
          <Card>
            <CardHeader className="px-4 pb-2">
              <CardTitle className="text-base">Registro de Presenças</CardTitle>
              <CardDescription className="text-xs">
                {attendance?.length ?? 0} check-ins registrados.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isAttendanceLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                </div>
              ) : attendance && attendance.length > 0 ? (
                <div className="divide-y">
                  {attendance.map(a => (
                    <div key={a.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="font-medium text-sm">{formatDate(a.date)}</p>
                        <p className="text-xs text-muted-foreground">{a.time}</p>
                      </div>
                      <Badge variant={a.type === 'Sábado' ? 'default' : 'secondary'} className="text-xs">
                        {a.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-sm text-muted-foreground italic">
                  Nenhuma presença registrada ainda.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── EXAMES ──────────────────────────────────────────────────────── */}
        {activeTab === 'exames' && (
          <Card>
            <CardHeader className="px-4 pb-2">
              <CardTitle className="text-base">Histórico de Exames</CardTitle>
              <CardDescription className="text-xs">Exames de graduação realizados.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isExamsLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                </div>
              ) : exams && exams.length > 0 ? (
                <div className="divide-y">
                  {exams.map(e => (
                    <div key={e.id} className="flex items-start justify-between gap-3 px-4 py-3.5">
                      <div>
                        <span className={cn(
                          'text-xs font-bold px-2 py-0.5 rounded-full capitalize inline-block',
                          beltStyles[e.targetBelt?.toLowerCase()]?.bg ?? 'bg-muted',
                          beltStyles[e.targetBelt?.toLowerCase()]?.text ?? 'text-foreground'
                        )}>
                          Faixa {e.targetBelt}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(e.examDate)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge
                          variant={e.paymentStatus === 'Pago' ? 'outline' : 'destructive'}
                          className={cn('text-xs', e.paymentStatus === 'Pago' ? 'border-green-500 text-green-700' : '')}
                        >
                          {e.paymentStatus}
                        </Badge>
                        {e.paymentAmount ? (
                          <p className="text-xs font-medium text-muted-foreground mt-1">
                            R$ {Number(e.paymentAmount).toFixed(2).replace('.', ',')}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-sm text-muted-foreground italic">
                  Nenhum exame registrado.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── CURRÍCULO ───────────────────────────────────────────────────── */}
        {activeTab === 'curriculo' && (
          <Card>
            <CardHeader className="px-4 pb-2">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
                  beltStyle.bg, beltStyle.text
                )}>
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Currículo — Faixa {student.belt}</CardTitle>
                  <CardDescription className="text-xs">Matérias do programa da sua graduação atual.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4">
              {isHandbookLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
                </div>
              ) : handbook?.techniques?.length ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">
                      {handbook.techniques.length} matéria{handbook.techniques.length !== 1 ? 's' : ''}
                    </span>
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full capitalize', beltStyle.bg, beltStyle.text)}>
                      Faixa {student.belt}
                    </span>
                  </div>
                  <ol className="space-y-2">
                    {handbook.techniques.map((technique, index) => (
                      <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <span className={cn(
                          'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold',
                          beltStyle.bg, beltStyle.text
                        )}>
                          {index + 1}
                        </span>
                        <span className="text-sm leading-relaxed pt-0.5">{technique}</span>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <div className="py-10 text-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">Currículo não disponível</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Nenhuma matéria cadastrada para a Faixa {student.belt} ainda.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── LOJA ────────────────────────────────────────────────────────── */}
        {activeTab === 'loja' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <ShoppingBag className="h-4 w-4 text-indigo-600" />
              <h2 className="text-sm font-semibold">Loja da Academia</h2>
            </div>

            {isProductsLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
              </div>
            ) : productsError ? (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center gap-2">
                  <ShoppingBag className="h-8 w-8 text-destructive/40" />
                  <p className="text-sm font-medium text-destructive">Não foi possível carregar os produtos</p>
                  <p className="text-xs text-muted-foreground">{productsError}</p>
                  <Button variant="outline" size="sm" className="mt-2"
                    onClick={() => {
                      setIsProductsLoading(true);
                      setProductsError('');
                      fetch('/api/products').then(r => r.json()).then(d => setProducts(d.products ?? [])).catch(() => {}).finally(() => setIsProductsLoading(false));
                    }}>
                    Tentar novamente
                  </Button>
                </CardContent>
              </Card>
            ) : products.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-2">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground font-medium">Nenhum produto disponível no momento</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {products.map(product => {
                    const qty = cart[product.id] ?? 0;
                    const hasVariations = product.variations && product.variations.length > 0;
                    const chosenVariation = selectedVariations[product.id];
                    const canAdd = !hasVariations || !!chosenVariation;
                    return (
                      <Card key={product.id} className="flex flex-col overflow-hidden">
                        {product.imageUrl ? (
                          <div className="aspect-square bg-muted overflow-hidden">
                            <img src={product.imageUrl} alt={product.name}
                              className="w-full h-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          </div>
                        ) : (
                          <div className="aspect-square bg-muted/50 flex items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                        )}
                        <CardContent className="flex flex-col gap-2 p-3 flex-1">
                          <div className="flex-1">
                            <p className="font-semibold text-sm leading-tight line-clamp-2">{product.name}</p>
                            {product.category && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">{product.category}</p>
                            )}
                          </div>
                          <p className="font-bold text-primary text-sm">
                            R$ {Number(product.price).toFixed(2).replace('.', ',')}
                          </p>
                          {hasVariations && (
                            <div className="flex flex-wrap gap-1">
                              {product.variations!.map(v => (
                                <button key={v} type="button" onClick={() => selectVariation(product.id, v)}
                                  className={cn(
                                    'text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors',
                                    chosenVariation === v
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : 'bg-background text-muted-foreground border-border hover:border-primary'
                                  )}>
                                  {v}
                                </button>
                              ))}
                            </div>
                          )}
                          {hasVariations && !chosenVariation && (
                            <p className="text-[10px] text-amber-600 font-medium">Selecione uma opção</p>
                          )}
                          <div className="flex items-center gap-2 justify-between">
                            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0"
                              onClick={() => updateQty(product.id, -1)} disabled={qty === 0}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className={cn('text-sm font-bold min-w-[1.5rem] text-center',
                              qty > 0 ? 'text-primary' : 'text-muted-foreground')}>
                              {qty}
                            </span>
                            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0"
                              onClick={() => updateQty(product.id, 1)} disabled={!canAdd}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {cartItems.length > 0 && (
                  <Card className="border-indigo-200 bg-indigo-50">
                    <CardHeader className="px-4 pt-4 pb-2">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-indigo-600" />
                        <CardTitle className="text-sm text-indigo-900">Seu pedido</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      <div className="space-y-1">
                        {cartItems.map(item => (
                          <div key={item.productId} className="flex justify-between text-sm">
                            <span className="text-indigo-800">
                              {item.quantity}× {item.name}
                              {item.variation && (
                                <span className="ml-1 text-[10px] font-semibold bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded">
                                  {item.variation}
                                </span>
                              )}
                            </span>
                            <span className="font-medium text-indigo-900">
                              R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between font-bold text-indigo-900 pt-2 border-t border-indigo-200">
                        <span>Total</span>
                        <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                      </div>
                      <Textarea
                        placeholder="Observações (tamanho, cor, etc.)"
                        value={orderNotes}
                        onChange={e => setOrderNotes(e.target.value)}
                        rows={2}
                        className="text-sm bg-white border-indigo-200 resize-none"
                      />
                      <Button onClick={handleOrder} disabled={isOrdering}
                        className="w-full bg-indigo-600 hover:bg-indigo-700">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {isOrdering ? 'Enviando pedido...' : 'Fazer pedido'}
                      </Button>
                      <p className="text-[10px] text-indigo-600 text-center leading-snug">
                        Seu pedido será confirmado pela academia em breve.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        <p className="text-center text-[10px] text-muted-foreground pb-2">
          Krav Magá IPIRANGA · Portal do Aluno
        </p>
      </div>

      {/* ── Fixed Bottom Navigation ──────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t">
        <div className="max-w-2xl mx-auto flex">
          {NAV_ITEMS.map(({ value, icon: Icon, label }) => {
            const isActive = activeTab === value;
            return (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                <span className={cn('text-[10px] leading-none font-medium', isActive && 'font-semibold')}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
