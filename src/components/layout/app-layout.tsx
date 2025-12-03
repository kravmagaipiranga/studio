
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Home,
  Users,
  CreditCard,
  ShieldCheck,
  Settings,
  PlusCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { FistIcon } from "@/components/icons";
import { UserNav } from "@/components/user-nav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
        <Sidebar>
            <AppSidebar />
        </Sidebar>
        <div className="flex flex-col">
          <AppHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            {children}
          </main>
        </div>
    </SidebarProvider>
  );
}

function AppSidebar() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader>
        <Link className="flex items-center gap-2 font-semibold" href="/">
          <FistIcon className="h-6 w-6" />
          <span className="">Krav Magá IPIRANGA</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton href="/" isActive={pathname === '/'}>
              <Home className="h-4 w-4" />
              Painel
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="/alunos" isActive={pathname.startsWith('/alunos')}>
              <Users className="h-4 w-4" />
              Alunos
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="#" isActive={pathname.startsWith('/pagamentos')}>
              <CreditCard className="h-4 w-4" />
              Pagamentos
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="#" isActive={pathname.startsWith('/exames')}>
              <ShieldCheck className="h-4 w-4" />
              Exames
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Card x-chunk="dashboard-02-chunk-0">
          <CardHeader className="p-2 pt-0 md:p-4">
            <CardTitle>Novo Aluno?</CardTitle>
            <CardDescription>
              Cadastre um novo aluno para começar.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
            <Link href="/register">
                <Button size="sm" className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Aluno
                </Button>
            </Link>
          </CardContent>
        </Card>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton href="#">
                    <Settings className="h-4 w-4" />
                    Configurações
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}

function AppHeader() {
  const { isMobile } = useSidebar();
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      {isMobile && <SidebarTrigger />}
      <div className="w-full flex-1">
        {/* Can add a global search here if needed */}
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Bell className="h-4 w-4" />
        <span className="sr-only">Alternar notificações</span>
      </Button>
      <UserNav />
    </header>
  );
}
