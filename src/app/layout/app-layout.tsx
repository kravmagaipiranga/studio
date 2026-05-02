
"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  Home,
  Users,
  CreditCard,
  ShieldCheck,
  Menu,
  BookCopy,
  ClipboardList,
  CalendarPlus,
  BarChart,
  Cake,
  Wallet,
  ListChecks,
  UserCircle,
  LogOut,
  Phone,
  UserPlus,
  CalendarX,
  Star,
  Sparkles,
  CheckSquare,
  PieChart,
  Settings,
  Building2,
  MessageSquare,
  BookOpen,
  Megaphone,
  ShoppingBag,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser, useCollection, useFirestore, useMemoFirebase, useAuth } from "@/firebase";
import { useEffect, useMemo, useState, Suspense } from "react";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";
import { collection } from "firebase/firestore";
import type { Student, WomensMonthLead, Company } from "@/lib/types";
import { signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { subDays, isAfter, parseISO, addDays, isSameDay } from 'date-fns';

const MENU_ITEMS = [
  { href: "/alunos", label: "Alunos", icon: Users },
  { href: "/chamada", label: "Controle de Presença", icon: CheckSquare },
  { href: "/central-de-mensagens", label: "Central de Mensagens", icon: MessageSquare, color: "text-blue-600" },
  { href: "/mes-das-mulheres", label: "Mês das Mulheres", icon: Star, color: "text-pink-600" },
  { href: "/empresas", label: "Empresas", icon: Building2 },
  { href: "/agendamentos", label: "Agendamentos", icon: CalendarPlus },
  { href: "/pagamentos", label: "Pagamentos", icon: CreditCard },
  { href: "/planos-vencidos", label: "Planos Vencidos", icon: CalendarX },
  { href: "/creditos", label: "Créditos", icon: Wallet },
  { href: "/exames", label: "Exames", icon: ShieldCheck },
  { href: "/seminarios", label: "Seminários", icon: BookCopy },
  { href: "/aulas", label: "Aulas Particulares", icon: ClipboardList },
  { href: "/lista-de-tarefas", label: "Lista de Tarefas", icon: ListChecks },
  { href: "/leads", label: "Leads CAT CPKM", icon: Phone },
  { href: "/register", label: "Cadastro Público", icon: UserPlus, target: "_blank" },
  { href: "/apostila", label: "Apostila", icon: BookOpen, color: "text-emerald-600" },
  { href: "/avisos", label: "Avisos", icon: Megaphone, color: "text-orange-500" },
  { href: "/loja", label: "Loja", icon: ShoppingBag, color: "text-indigo-600" },
];

const publicRoutes = ["/login", "/register", "/login-aluno", "/portal-aluno", "/mes-das-mulheres/registro"];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const studentsCollection = useMemoFirebase(() => {
    if (!firestore || !user || !mounted) return null;
    return collection(firestore, 'students');
  }, [firestore, user, mounted]);

  const womensMonthCollection = useMemoFirebase(() => {
    if (!firestore || !user || !mounted) return null;
    return collection(firestore, 'womensMonth');
  }, [firestore, user, mounted]);

  const companiesCollection = useMemoFirebase(() => {
    if (!firestore || !user || !mounted) return null;
    return collection(firestore, 'companies');
  }, [firestore, user, mounted]);

  const { data: students } = useCollection<Student>(studentsCollection);
  const { data: womensLeads } = useCollection<WomensMonthLead>(womensMonthCollection);
  const { data: companies } = useCollection<Company>(companiesCollection);

  const birthdayStudents = useMemo(() => {
    if (!students || !mounted) return [];
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    return students.filter(student => {
      if (!student.dob) return false;
      try {
        const dob = new Date(student.dob + "T00:00:00");
        return (dob.getMonth() + 1) === todayMonth && dob.getDate() === todayDay;
      } catch {
        return false;
      }
    });
  }, [students, mounted]);

  const upcomingCorporateEvents = useMemo(() => {
    if (!companies || !mounted) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = addDays(today, 1);
    
    return companies.filter(company => {
      if (!company.eventDate) return false;
      try {
        const eventDate = parseISO(company.eventDate);
        return isSameDay(eventDate, today) || isSameDay(eventDate, tomorrow);
      } catch {
        return false;
      }
    }).sort((a, b) => (a.eventDate! > b.eventDate! ? 1 : -1));
  }, [companies, mounted]);

  const pendingStudents = useMemo(() => {
    if (!students || !mounted) return [];
    return students.filter(student => student.status === 'Pendente');
  }, [students, mounted]);

  const recentWomensLeads = useMemo(() => {
    if (!womensLeads || !mounted) return [];
    const oneDayAgo = subDays(new Date(), 1);
    return womensLeads
      .filter(lead => {
        try {
          return isAfter(parseISO(lead.createdAt), oneDayAgo);
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        try {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } catch {
          return 0;
        }
      });
  }, [womensLeads, mounted]);

  const totalNotifications = mounted 
    ? (birthdayStudents?.length || 0) + (pendingStudents?.length || 0) + (recentWomensLeads?.length || 0) + (upcomingCorporateEvents?.length || 0)
    : 0;

  useEffect(() => {
    if (isUserLoading || !pathname || !mounted) return;
    
    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));
    
    if (!user && !isPublicRoute) {
      router.push('/login');
    }
  }, [isUserLoading, user, pathname, router, mounted]);

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  if (!mounted) return null;

  if (pathname && publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/"))) {
    return <>{children}</>;
  }
  
  if (isUserLoading || !user) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          Carregando...
        </div>
      );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] overflow-hidden">
       <FirebaseErrorListener />
      
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-muted/40 md:block h-screen">
        <div className="flex h-full flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 shrink-0">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="truncate">Krav Magá IPIRANGA</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-4 gap-1">
              <Suspense fallback={<div className="p-4 space-y-2"><div className="h-8 w-full bg-muted animate-pulse rounded" /></div>}>
                {MENU_ITEMS.map((item) => (
                  <NavItem key={item.href} href={item.href} target={item.target}>
                    <item.icon className={cn("h-4 w-4", item.color)} /> {item.label}
                  </NavItem>
                ))}
              </Suspense>
            </nav>
          </div>
        </div>
      </div>

      <div className="flex flex-col h-screen overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden h-9 w-9"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Navegação</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-72">
               <SheetHeader className="p-6 border-b">
                  <SheetTitle className="text-left">Gestão Krav Magá</SheetTitle>
                  <SheetDescription className="text-left">Navegação do sistema</SheetDescription>
              </SheetHeader>
              <nav className="flex-1 overflow-y-auto p-2">
                <div className="grid gap-1">
                  <Suspense fallback={null}>
                    {MENU_ITEMS.map((item) => (
                      <NavItem key={item.href} href={item.href} isMobile target={item.target}>
                        <item.icon className={cn("h-5 w-5", item.color)} /> {item.label}
                      </NavItem>
                    ))}
                  </Suspense>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1 font-semibold truncate md:hidden">
            KM Ipiranga
          </div>
          <div className="w-full flex-1 hidden md:block" />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 relative shrink-0">
                <Bell className="h-4 w-4" />
                {totalNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
                    {totalNotifications}
                  </span>
                )}
                <span className="sr-only">Notificações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              {pendingStudents.length > 0 && (
                <>
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" /> Novos Alunos
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {pendingStudents.map(student => (
                    <DropdownMenuItem key={student.id} asChild>
                      <Link href={`/alunos/${student.id}/editar`}>
                        <span className="truncate">{student.name} aguarda ativação.</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              {upcomingCorporateEvents.length > 0 && (
                <>
                  {(pendingStudents.length > 0) && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="flex items-center gap-2 text-blue-600">
                    <Building2 className="h-4 w-4" /> Próximos Eventos Empresas
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {upcomingCorporateEvents.map(event => (
                    <DropdownMenuItem key={event.id} asChild>
                      <Link href="/empresas">
                        <div className="flex flex-col gap-0.5">
                          <span className="truncate font-bold">{event.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {isSameDay(parseISO(event.eventDate!), new Date()) ? 'HOJE' : 'AMANHÃ'} às {event.eventTime || '--:--'}
                          </span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              {recentWomensLeads.length > 0 && (
                <>
                  {(pendingStudents.length > 0 || upcomingCorporateEvents.length > 0) && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="flex items-center gap-2 text-pink-600">
                    <Sparkles className="h-4 w-4" /> Mês das Mulheres (24h)
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {recentWomensLeads.map(lead => (
                    <DropdownMenuItem key={lead.id} asChild>
                      <Link href="/mes-das-mulheres">
                        <span className="truncate">{lead.name} se inscreveu agora!</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              
              {birthdayStudents.length > 0 && (
                  <>
                    {(pendingStudents.length > 0 || recentWomensLeads.length > 0 || upcomingCorporateEvents.length > 0) && <DropdownMenuSeparator />}
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <Cake className="h-4 w-4" /> Aniversariantes de Hoje
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {birthdayStudents.map(student => (
                      <DropdownMenuItem key={student.id} disabled>
                        <span className="truncate">Parabéns, {student.name}!</span>
                      </DropdownMenuItem>
                    ))}
                  </>
              )}
              
              {totalNotifications === 0 && (
                <DropdownMenuItem disabled>Nenhuma notificação importante.</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 h-9">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user?.photoURL || undefined} />
                      <AvatarFallback><UserCircle className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                    <span className="font-medium hidden sm:inline">Admin</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Gestão</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/dashboard"><Home className="mr-2 h-4 w-4" />Painel</Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href="/indicadores"><BarChart className="mr-2 h-4 w-4" />Indicadores</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/indicadores-internos"><PieChart className="mr-2 h-4 w-4" />Indicadores Internos</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/configuracoes"><Settings className="mr-2 h-4 w-4" />Configurações</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 bg-background">
          <div className="mx-auto max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ href, children, isMobile = false, target }: { href: string; children: React.ReactNode; isMobile?: boolean; target?: string; }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const isActive = pathname ? (href === "/" ? pathname === "/" : pathname.startsWith(href)) : false;
  
  const linkProps = {
    href: href,
    target: target,
    rel: target === '_blank' ? 'noopener noreferrer' : undefined,
  };

  const className = cn(
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:text-primary",
    isMobile ? "text-base py-3" : "text-sm",
    !target && isActive && "bg-muted text-primary font-bold shadow-sm"
  );

  return (
    <Link {...linkProps} className={className}>
      {children}
    </Link>
  );
}
