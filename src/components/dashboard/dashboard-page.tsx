"use client";

import Link from "next/link";
import {
  Bell,
  Home,
  Users,
  CreditCard,
  ShieldCheck,
  Settings,
  PlusCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { FistIcon } from "@/components/icons";
import { UserNav } from "@/components/user-nav";
import { Overview } from "./overview";
import { RevenueChart } from "./revenue-chart";
import { DuePayments } from "./due-payments";

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <div className="min-h-screen">
        <AppSidebar />
        <div className="flex flex-col">
          <SidebarInset>
            <AppHeader />
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
              <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
              </div>
              <div className="flex flex-1 rounded-lg shadow-sm" x-chunk="dashboard-02-chunk-1">
                <div className="flex flex-col w-full gap-4">
                  <Overview />
                  <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                    <RevenueChart />
                    <DuePayments />
                  </div>
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <Link className="flex items-center gap-2 font-semibold" href="#">
          <FistIcon className="h-6 w-6" />
          <span className="">Krav Magá IPIRANGA</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton href="#" isActive>
              <Home className="h-4 w-4" />
              Dashboard
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="#">
              <Users className="h-4 w-4" />
              Students
              <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                6
              </Badge>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="#">
              <CreditCard className="h-4 w-4" />
              Payments
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="#">
              <ShieldCheck className="h-4 w-4" />
              Exams
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Card x-chunk="dashboard-02-chunk-0">
          <CardHeader className="p-2 pt-0 md:p-4">
            <CardTitle>New Student?</CardTitle>
            <CardDescription>
              Register a new student to get them started.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
            <Link href="/register">
                <Button size="sm" className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
            </Link>
          </CardContent>
        </Card>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton href="#">
                    <Settings className="h-4 w-4" />
                    Settings
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
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
        <span className="sr-only">Toggle notifications</span>
      </Button>
      <UserNav />
    </header>
  );
}
