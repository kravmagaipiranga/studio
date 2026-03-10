
"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { collection } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Student } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Search, MessageSquare, Cake, Phone } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

function BirthdayListContent() {
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const month = searchParams.get("month") || format(new Date(), "MM");
  const year = searchParams.get("year") || format(new Date(), "yyyy");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const studentsQuery = useMemoFirebase(() => {
    if (!firestore || !isMounted) return null;
    return collection(firestore, "students");
  }, [firestore, isMounted]);

  const { data: students, isLoading } = useCollection<Student>(studentsQuery);

  const monthlyBirthdays = useMemo(() => {
    if (!students) return [];
    
    let filtered = students.filter(s => {
      if (!s.dob) return false;
      const dobMonth = s.dob.split('-')[1];
      return dobMonth === month;
    });

    if (searchQuery) {
      filtered = filtered.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return filtered.sort((a, b) => {
      const dayA = Number(a.dob.split('-')[2]);
      const dayB = Number(b.dob.split('-')[2]);
      return dayA - dayB;
    });
  }, [students, month, searchQuery]);

  const getBirthdayWhatsAppLink = (student: Student) => {
    const phone = student.phone?.replace(/\D/g, '');
    const firstName = student.name.split(' ')[0];
    const message = `Parabéns, ${firstName}! Feliz aniversário! 🎂🥳\n\nDesejamos que seu novo ciclo seja repleto de força, saúde, superação e muito Krav Magá. Estamos muito felizes em ter você treinando conosco no Centro de Treinamento Krav Magá Ipiranga! 🛡️👊\n\nAproveite seu dia! Kida!`;
    return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
  };

  const monthName = format(new Date(2024, Number(month) - 1, 1), "MMMM", { locale: ptBR });

  if (!isMounted) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar aos Indicadores
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Cake className="h-6 w-6 text-pink-500" />
          Aniversariantes de {monthName}
        </h1>
        <p className="text-muted-foreground">Lista completa de alunos que celebram aniversário no mês selecionado.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Dia</TableHead>
                <TableHead>Aluno</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Faixa</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : monthlyBirthdays.length > 0 ? (
                monthlyBirthdays.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-bold text-pink-600">
                      Dia {student.dob.split('-')[2]}
                    </TableCell>
                    <TableCell className="font-medium">
                      {student.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.status === 'Ativo' ? 'default' : 'secondary'}>
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {student.belt}
                    </TableCell>
                    <TableCell className="text-muted-foreground flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {student.phone}
                    </TableCell>
                    <TableCell className="text-right">
                      <a 
                        href={getBirthdayWhatsAppLink(student)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={cn(!student.phone && "pointer-events-none opacity-50")}
                      >
                        <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Parabenizar
                        </Button>
                      </a>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhum aniversariante encontrado para {monthName}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BirthdayListPage() {
  return (
    <Suspense fallback={<div className="p-8"><Skeleton className="h-64 w-full" /></div>}>
      <BirthdayListContent />
    </Suspense>
  );
}
