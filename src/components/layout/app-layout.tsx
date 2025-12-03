"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button";
import { FistIcon } from "@/components/icons";
import { UserNav } from "@/components/user-nav";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't show layout for public registration page
  if (pathname === '/register') {
    return <>{children}</>;
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <FistIcon className="h-6 w-6" />
              <span className="">Krav Magá IPIRANGA</span>
            </Link>
            <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Alternar notificações</span>
            </Button>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <NavItem href="/dashboard">
                <Home className="h-4 w-4" />
                Painel
              </NavItem>
               <NavItem href="/agendamentos">
                <CalendarPlus className="h-4 w-4" />
                Agendamentos
              </NavItem>
              <NavItem href="/alunos">
                <Users className="h-4 w-4" />
                Alunos
              </NavItem>
              <NavItem href="/pagamentos">
                <CreditCard className="h-4 w-4" />
                Pagamentos
              </NavItem>
              <NavItem href="/exames">
                <ShieldCheck className="h-4 w-4" />
                Exames
              </NavItem>
              <NavItem href="/seminarios">
                <BookCopy className="h-4 w-4" />
                Seminários
              </NavItem>
               <NavItem href="/aulas">
                <ClipboardList className="h-4 w-4" />
                Aulas Particulares
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
                <span className="sr-only">Alternar menu de navegação</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="#"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <FistIcon className="h-6 w-6" />
                  <span>Krav Magá IPIRANGA</span>
                </Link>
                <NavItem href="/dashboard" isMobile>
                  <Home className="h-5 w-5" />
                  Painel
                </NavItem>
                 <NavItem href="/agendamentos" isMobile>
                  <CalendarPlus className="h-5 w-5" />
                  Agendamentos
                </NavItem>
                <NavItem href="/alunos" isMobile>
                  <Users className="h-5 w-5" />
                  Alunos
                </NavItem>
                <NavItem href="/pagamentos" isMobile>
                  <CreditCard className="h-5 w-5" />
                  Pagamentos
                </NavItem>
                 <NavItem href="/exames" isMobile>
                  <ShieldCheck className="h-5 w-5" />
                  Exames
                </NavItem>
                <NavItem href="/seminarios" isMobile>
                  <BookCopy className="h-5 w-5" />
                  Seminários
                </NavItem>
                <NavItem href="/aulas" isMobile>
                  <ClipboardList className="h-5 w-5" />
                  Aulas Particulares
                </NavItem>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            {/* Futuro campo de busca global */}
          </div>
          <UserNav />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({ href, children, isMobile = false }: { href: string; children: React.ReactNode; isMobile?: boolean; }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  if (isMobile) {
    return (
       <Link
        href={href}
        className={cn(
            "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
            isActive && "bg-muted text-foreground"
        )}
      >
        {children}
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        isActive && "text-primary bg-muted"
      )}
    >
      {children}
    </Link>
  );
}
