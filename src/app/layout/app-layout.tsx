"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  ShoppingCart,
  BarChart,
  Cake,
  Wallet,
  ListChecks,
  Shirt,
  UserCircle,
  LogOut,
  Phone,
  UserPlus,
  CalendarX,
  Star,
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
import { useEffect, useMemo, useState } from "react";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";
import { collection } from "firebase/firestore";
import type { Student } from "@/lib/types";
import { signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const protectedAdminRoutes = [
  "/alunos",
  "/agendamentos",
  "/pagamentos",
  "/creditos",
  "/exames",
  "/seminarios",
  "/aulas",
  "/vendas",
  "/uniformes",
  "/lista-de-tarefas",
  "/dashboard",
  "/indicadores",
  "/leads",
  "/planos-vencidos",
  "/mes-das-mulheres",
];

const publicRoutes = ["/login", "/register", "/login-aluno", "/portal-aluno", "/mes-das-mulheres/registro", "/gift-card"];

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
    if (!firestore || !user) return null;
    return collection(firestore, 'students');
  }, [firestore, user]);

  const { data: students } = useCollection<Student>(studentsCollection);

  const birthdayStudents = useMemo(() => {
    if (!students) return [];
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
  }, [students]);

  const pendingStudents = useMemo(() => {
    if (!students) return [];
    return students.filter(student => student.status === 'Pendente');
  }, [students]);

  const totalNotifications = (birthdayStudents?.length || 0) + (pendingStudents?.length || 0);

  useEffect(() => {
    if (isUserLoading || !pathname || !mounted) return;
    
    const isProtectedRoute = protectedAdminRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));

    if (!user && isProtectedRoute) {
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
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
       <FirebaseErrorListener />
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="">Krav Magá IPIRANGA</span>
            </Link>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="ml-auto h-8 w-8 relative">
                  <Bell className="h-4 w-4" />
                  {totalNotifications > 0 && (
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
                  )}
                  <span className="sr-only">Notificações</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {pendingStudents.length > 0 && (
                  <>
                    <DropdownMenuLabel>Novos Cadastros</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {pendingStudents.map(student => (
                      <DropdownMenuItem key={student.id} asChild>
                        <Link href={`/alunos/${student.id}/editar`}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          <span className="truncate">{student.name} aguarda ativação.</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                
                {birthdayStudents.length > 0 && (
                    <>
                      {pendingStudents.length > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuLabel>Aniversariantes de Hoje</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {birthdayStudents.map(student => (
                        <DropdownMenuItem key={student.id}>
                          <Cake className="mr-2 h-4 w-4" />
                          <span>Parabéns, {student.name}!</span>
                        </DropdownMenuItem>
                      ))}
                    </>
                )}
                {totalNotifications === 0 && (
                  <DropdownMenuItem disabled>Nenhuma notificação hoje.</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex-1 overflow-auto">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-4">
              <NavItem href="/alunos">
                <Users className="h-4 w-4" /> Alunos
              </NavItem>
              <NavItem href="/mes-das-mulheres">
                <Star className="h-4 w-4 text-pink-600" /> Mês das Mulheres
              </NavItem>
              <NavItem href="/agendamentos">
                <CalendarPlus className="h-4 w-4" /> Agendamentos
              </NavItem>
              <NavItem href="/pagamentos">
                <CreditCard className="h-4 w-4" /> Pagamentos
              </NavItem>
              <NavItem href="/planos-vencidos">
                <CalendarX className="h-4 w-4" /> Planos Vencidos
              </NavItem>
              <NavItem href="/creditos">
                <Wallet className="h-4 w-4" /> Créditos
              </NavItem>
              <NavItem href="/exames">
                <ShieldCheck className="h-4 w-4" /> Exames
              </NavItem>
              <NavItem href="/seminarios">
                <BookCopy className="h-4 w-4" /> Seminários
              </NavItem>
              <NavItem href="/aulas">
                <ClipboardList className="h-4 w-4" /> Aulas Particulares
              </NavItem>
              <NavItem href="/vendas">
                <ShoppingCart className="h-4 w-4" /> Vendas
              </NavItem>
              <NavItem href="/uniformes">
                <Shirt className="h-4 w-4" /> Uniformes
              </NavItem>
              <NavItem href="/lista-de-tarefas">
                <ListChecks className="h-4 w-4" /> Lista de Tarefas
              </NavItem>
              <NavItem href="/leads">
                <Phone className="h-4 w-4" /> Leads CAT CPKM
              </NavItem>
              <NavItem href="/register" target="_blank">
                <UserPlus className="h-4 w-4" /> Cadastro Público
              </NavItem>
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Navegação</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
               <SheetHeader className="sr-only">
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>Navegação principal.</SheetDescription>
              </SheetHeader>
              <nav className="grid gap-2 text-lg font-medium">
                <Link href="#" className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <span>Krav Magá IPIRANGA</span>
                </Link>
                <NavItem href="/alunos" isMobile><Users className="h-5 w-5" /> Alunos</NavItem>
                <NavItem href="/mes-das-mulheres" isMobile><Star className="h-5 w-5 text-pink-600" /> Mês das Mulheres</NavItem>
                <NavItem href="/agendamentos" isMobile><CalendarPlus className="h-5 w-5" /> Agendamentos</NavItem>
                <NavItem href="/pagamentos" isMobile><CreditCard className="h-5 w-5" /> Pagamentos</NavItem>
                <NavItem href="/planos-vencidos" isMobile><CalendarX className="h-5 w-5" /> Planos Vencidos</NavItem>
                <NavItem href="/exames" isMobile><ShieldCheck className="h-5 w-5" /> Exames</NavItem>
                <NavItem href="/aulas" isMobile><ClipboardList className="h-5 w-5" /> Aulas Particulares</NavItem>
                <NavItem href="/vendas" isMobile><ShoppingCart className="h-5 w-5" /> Vendas</NavItem>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.photoURL || undefined} />
                      <AvatarFallback><UserCircle className="h-6 w-6" /></AvatarFallback>
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
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({ href, children, isMobile = false, target }: { href: string; children: React.ReactNode; isMobile?: boolean; target?: string; }) {
  const pathname = usePathname();
  const isActive = pathname ? (href === "/" ? pathname === "/" : pathname.startsWith(href)) : false;
  
  const linkProps = {
    href: href,
    target: target,
    rel: target === '_blank' ? 'noopener noreferrer' : undefined,
  };

  const className = cn(
    isMobile 
      ? "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
      : "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
    !target && isActive && (isMobile ? "bg-muted text-foreground" : "text-primary bg-muted")
  );

  return (
    <Link {...linkProps} className={className}>
      {children}
    </Link>
  );
}
