'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Student, Payment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StudentPortalForm } from '@/components/students/student-portal-form';

export default function StudentPortalPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const studentQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'students'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: studentData, isLoading: isStudentLoading } = useCollection<Student>(studentQuery);
  const student = useMemo(() => studentData?.[0], [studentData]);

  const lastPaymentQuery = useMemoFirebase(() => {
    if (!firestore || !student) return null;
    return query(collection(firestore, 'payments'), where('studentId', '==', student.id), orderBy('paymentDate', 'desc'), limit(1));
  }, [firestore, student]);

  const { data: lastPaymentData, isLoading: isLastPaymentLoading } = useCollection<Payment>(lastPaymentQuery);
  const lastPayment = useMemo(() => lastPaymentData?.[0], [lastPaymentData]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login-aluno');
    }
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
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-64 w-full max-w-3xl" />
      </div>
    );
  }
  
  if (!student) {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 text-center">
             <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-destructive">Perfil Não Encontrado</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">
                        Não encontramos um perfil de aluno associado a este login.
                        Por favor, entre em contato com o administrador.
                    </p>
                    <Button onClick={handleLogout} variant="destructive">
                       <LogOut className="mr-2 h-4 w-4" /> Sair
                    </Button>
                </CardContent>
             </Card>
        </div>
    )
  }

  const DataItem = ({ label, value }: { label: string; value: string | undefined | null }) => (
    <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value || ' - '}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Portal do Aluno</h1>
            <p className="text-muted-foreground">Bem-vindo(a) de volta, {student.name.split(' ')[0]}!</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Minhas Informações</CardTitle>
                    <CardDescription>Seus dados de treino e plano.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <DataItem label="Faixa Atual" value={student.belt} />
                    <DataItem label="Status" value={student.status} />
                    <DataItem label="Tipo de Plano" value={student.planType} />

                    {isLastPaymentLoading ? (
                        <>
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </>
                    ) : lastPayment ? (
                        <>
                            <DataItem 
                                label="Data do Último Pagamento" 
                                value={new Date(lastPayment.paymentDate + "T00:00:00").toLocaleDateString('pt-BR')} 
                            />
                            <DataItem 
                                label="Valor Pago" 
                                value={`R$ ${lastPayment.amount.toFixed(2)}`} 
                            />
                            <DataItem 
                                label="Validade do Plano" 
                                value={lastPayment.expirationDate ? new Date(lastPayment.expirationDate + "T00:00:00").toLocaleDateString('pt-BR') : 'N/A'} 
                            />
                        </>
                    ) : (
                        <>
                            {/* Fallback to student data if no payment document is found */}
                            <DataItem 
                                label="Data do Último Pagamento" 
                                value={student.lastPaymentDate ? new Date(student.lastPaymentDate + "T00:00:00").toLocaleDateString('pt-BR') : 'N/A'}
                            />
                            <DataItem 
                                label="Valor do Plano" 
                                value={typeof student.planValue === 'number' ? `R$ ${student.planValue.toFixed(2)}` : 'N/A'}
                            />
                            <DataItem 
                                label="Validade do Plano" 
                                value={student.planExpirationDate ? new Date(student.planExpirationDate + "T00:00:00").toLocaleDateString('pt-BR') : 'N/A'} 
                            />
                        </>
                    )}
                </CardContent>
            </Card>

            <StudentPortalForm student={student} />
        </div>
      </div>
    </div>
  );
}
