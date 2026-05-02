'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Student, Payment, Attendance, Exam, HandbookContent, Notice } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, User, CreditCard, CalendarCheck, GraduationCap, ShieldAlert, Coins, BookOpen, Home, Megaphone, AlertCircle } from 'lucide-react';
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

export default function StudentPortalPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Student
  const studentQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'students'), where('userId', '==', user.uid));
  }, [firestore, user]);
  const { data: studentData, isLoading: isStudentLoading } = useCollection<Student>(studentQuery);
  const student = useMemo(() => studentData?.[0], [studentData]);

  // All payments
  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore || !student) return null;
    return query(collection(firestore, 'payments'), where('studentId', '==', student.id), orderBy('paymentDate', 'desc'));
  }, [firestore, student]);
  const { data: payments, isLoading: isPaymentsLoading } = useCollection<Payment>(paymentsQuery);

  // Attendance (last 100 check-ins)
  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore || !student) return null;
    return query(collection(firestore, 'attendance'), where('studentId', '==', student.id), orderBy('date', 'desc'), limit(100));
  }, [firestore, student]);
  const { data: attendance, isLoading: isAttendanceLoading } = useCollection<Attendance>(attendanceQuery);

  // Exams
  const examsQuery = useMemoFirebase(() => {
    if (!firestore || !student) return null;
    return query(collection(firestore, 'exams'), where('studentId', '==', student.id), orderBy('examDate', 'desc'));
  }, [firestore, student]);
  const { data: exams, isLoading: isExamsLoading } = useCollection<Exam>(examsQuery);

  // Active notices — fetched via API route (Admin SDK, bypasses Firestore rules)
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isNoticesLoading, setIsNoticesLoading] = useState(true);
  useEffect(() => {
    setIsNoticesLoading(true);
    fetch('/api/notices')
      .then((r) => r.json())
      .then((data) => setNotices(data.notices ?? []))
      .catch(() => setNotices([]))
      .finally(() => setIsNoticesLoading(false));
  }, []);

  // Handbook (curriculum for student's current belt)
  const handbookQuery = useMemoFirebase(() => {
    if (!firestore || !student) return null;
    const beltId = student.belt?.toLowerCase() ?? 'branca';
    return query(collection(firestore, 'handbook'), where('id', '==', beltId));
  }, [firestore, student]);
  const { data: handbookData, isLoading: isHandbookLoading } = useCollection<HandbookContent>(handbookQuery);
  const handbook = useMemo(() => handbookData?.[0], [handbookData]);

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

  if (isUserLoading || isStudentLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <div className="space-y-4 w-full max-w-3xl p-8">
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
              Não encontramos um perfil de aluno associado a este login.
              Por favor, entre em contato com a administração.
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
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Krav Magá IPIRANGA</p>
            <h1 className="text-lg font-bold leading-tight">Portal do Aluno</h1>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">

        {/* Student Hero Card */}
        <Card className="overflow-hidden">
          <div className="bg-primary/5 border-b px-6 py-5">
            <div className="flex items-center gap-4">
              <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0", beltStyle.bg, beltStyle.text)}>
                {getInitials(student.name)}
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold truncate">{student.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full capitalize", beltStyle.bg, beltStyle.text)}>
                    Faixa {student.belt}
                  </span>
                  <Badge variant={student.status === 'Ativo' ? 'default' : student.status === 'Inativo' ? 'secondary' : 'destructive'}>
                    {student.status}
                  </Badge>
                  {student.paymentStatus && (
                    <Badge variant={student.paymentStatus === 'Pago' ? 'outline' : 'destructive'} className={student.paymentStatus === 'Pago' ? 'border-green-500 text-green-700' : ''}>
                      Pagamento: {student.paymentStatus}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          <CardContent className="p-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0">
              <div className="p-4 text-center">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Plano</p>
                <p className="text-base font-bold mt-1">{student.planType || '—'}</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Validade</p>
                <p className="text-base font-bold mt-1">{formatDate(lastPayment?.expirationDate ?? student.planExpirationDate)}</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Últ. Pagamento</p>
                <p className="text-base font-bold mt-1">{formatDate(lastPayment?.paymentDate ?? student.lastPaymentDate)}</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center justify-center gap-1">
                  <Coins className="h-3 w-3" /> Créditos
                </p>
                <p className={cn("text-base font-bold mt-1", credits > 0 ? "text-green-600" : "")}>
                  {credits > 0 ? `R$ ${credits.toFixed(2)}` : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="inicio" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="inicio" className="text-xs sm:text-sm px-1">
              <Home className="h-4 w-4 sm:mr-1 shrink-0" />
              <span className="hidden sm:inline">Início</span>
            </TabsTrigger>
            <TabsTrigger value="perfil" className="text-xs sm:text-sm px-1">
              <User className="h-4 w-4 sm:mr-1 shrink-0" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="pagamentos" className="text-xs sm:text-sm px-1">
              <CreditCard className="h-4 w-4 sm:mr-1 shrink-0" />
              <span className="hidden sm:inline">Pgtos</span>
            </TabsTrigger>
            <TabsTrigger value="presencas" className="text-xs sm:text-sm px-1">
              <CalendarCheck className="h-4 w-4 sm:mr-1 shrink-0" />
              <span className="hidden sm:inline">Pres.</span>
            </TabsTrigger>
            <TabsTrigger value="exames" className="text-xs sm:text-sm px-1">
              <GraduationCap className="h-4 w-4 sm:mr-1 shrink-0" />
              <span className="hidden sm:inline">Exames</span>
            </TabsTrigger>
            <TabsTrigger value="curriculo" className="text-xs sm:text-sm px-1">
              <BookOpen className="h-4 w-4 sm:mr-1 shrink-0" />
              <span className="hidden sm:inline">Currículo</span>
            </TabsTrigger>
          </TabsList>

          {/* Início / Dashboard */}
          <TabsContent value="inicio" className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Avisos da Academia</h2>
              </div>

              {isNoticesLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
                </div>
              ) : notices && notices.length > 0 ? (
                <div className="space-y-3">
                  {notices.map((notice) => {
                    const priorityStyles = {
                      normal:     { border: 'border-l-slate-400',  bg: 'bg-slate-50',   badge: 'bg-slate-100 text-slate-700',   label: 'Normal' },
                      importante: { border: 'border-l-amber-400',  bg: 'bg-amber-50',   badge: 'bg-amber-100 text-amber-800',   label: 'Importante' },
                      urgente:    { border: 'border-l-red-500',    bg: 'bg-red-50',     badge: 'bg-red-100 text-red-800',       label: 'Urgente' },
                    }[notice.priority] ?? { border: 'border-l-slate-400', bg: 'bg-slate-50', badge: 'bg-slate-100 text-slate-700', label: 'Normal' };

                    return (
                      <Card key={notice.id} className={cn('border-l-4', priorityStyles.border, priorityStyles.bg)}>
                        <CardHeader className="pb-2 pt-4">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base">{notice.title}</CardTitle>
                            {notice.priority !== 'normal' && (
                              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full shrink-0', priorityStyles.badge)}>
                                {priorityStyles.label}
                              </span>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-4">
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notice.content}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
                    <Megaphone className="h-10 w-10 text-muted-foreground/30" />
                    <p className="text-muted-foreground font-medium">Nenhum aviso no momento</p>
                    <p className="text-sm text-muted-foreground/70">Fique tranquilo, não há comunicados pendentes.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Meu Perfil */}
          <TabsContent value="perfil" className="pt-4">
            <StudentPortalForm student={student} />
          </TabsContent>

          {/* Pagamentos */}
          <TabsContent value="pagamentos" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Pagamentos</CardTitle>
                <CardDescription>Todos os pagamentos registrados na sua conta.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isPaymentsLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : payments && payments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead className="hidden sm:table-cell">Validade</TableHead>
                        <TableHead className="hidden sm:table-cell">Método</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{formatDate(p.paymentDate)}</TableCell>
                          <TableCell>{p.planType}</TableCell>
                          <TableCell className="font-bold text-green-700">R$ {Number(p.amount).toFixed(2)}</TableCell>
                          <TableCell className="hidden sm:table-cell">{formatDate(p.expirationDate)}</TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">{p.paymentMethod}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-10 text-center text-muted-foreground italic">
                    Nenhum pagamento encontrado.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Presenças */}
          <TabsContent value="presencas" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Presenças</CardTitle>
                <CardDescription>
                  Seus últimos {attendance?.length ?? 0} check-ins registrados.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isAttendanceLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : attendance && attendance.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Horário</TableHead>
                        <TableHead>Tipo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{formatDate(a.date)}</TableCell>
                          <TableCell>{a.time}</TableCell>
                          <TableCell>
                            <Badge variant={a.type === 'Sábado' ? 'default' : 'secondary'} className="text-xs">
                              {a.type}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-10 text-center text-muted-foreground italic">
                    Nenhuma presença registrada ainda.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exames */}
          <TabsContent value="exames" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Exames</CardTitle>
                <CardDescription>Seus exames de graduação realizados.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isExamsLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : exams && exams.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Graduação Almejada</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead className="hidden sm:table-cell">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exams.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">{formatDate(e.examDate)}</TableCell>
                          <TableCell>
                            <span className={cn(
                              "text-xs font-bold px-2 py-1 rounded-full capitalize",
                              beltStyles[e.targetBelt?.toLowerCase()]?.bg ?? 'bg-muted',
                              beltStyles[e.targetBelt?.toLowerCase()]?.text ?? 'text-foreground'
                            )}>
                              Faixa {e.targetBelt}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={e.paymentStatus === 'Pago' ? 'outline' : 'destructive'} className={e.paymentStatus === 'Pago' ? 'border-green-500 text-green-700' : ''}>
                              {e.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell font-medium">
                            {e.paymentAmount ? `R$ ${Number(e.paymentAmount).toFixed(2)}` : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-10 text-center text-muted-foreground italic">
                    Nenhum exame registrado.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Currículo */}
          <TabsContent value="curriculo" className="pt-4">
            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", beltStyle.bg, beltStyle.text)}>
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Currículo — Faixa {student.belt}</CardTitle>
                    <CardDescription>
                      Matérias do programa da sua graduação atual.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isHandbookLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-lg" />
                    ))}
                  </div>
                ) : handbook && handbook.techniques && handbook.techniques.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">
                        {handbook.techniques.length} matéria{handbook.techniques.length !== 1 ? 's' : ''} cadastrada{handbook.techniques.length !== 1 ? 's' : ''}
                      </span>
                      <span className={cn("text-xs font-bold px-3 py-1 rounded-full capitalize", beltStyle.bg, beltStyle.text)}>
                        Faixa {student.belt}
                      </span>
                    </div>
                    <ol className="space-y-2">
                      {handbook.techniques.map((technique, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
                        >
                          <span className={cn(
                            "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                            beltStyle.bg, beltStyle.text
                          )}>
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium leading-relaxed pt-0.5">{technique}</span>
                        </li>
                      ))}
                    </ol>
                  </>
                ) : (
                  <div className="py-12 text-center">
                    <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">Currículo não disponível</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Nenhuma matéria foi cadastrada para a Faixa {student.belt} ainda.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        <p className="text-center text-xs text-muted-foreground pb-4">
          Krav Magá IPIRANGA · Portal do Aluno · Dados em tempo real
        </p>
      </div>
    </div>
  );
}
