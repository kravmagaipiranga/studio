'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import Link from 'next/link';
import { Bell } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function LoginAlunoPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [noticesCount, setNoticesCount] = useState(0);
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/notices')
      .then((r) => r.json())
      .then((data) => setNoticesCount((data.notices ?? []).length))
      .catch(() => setNoticesCount(0));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!auth) {
      toast({ variant: 'destructive', title: 'Erro de Autenticação', description: 'O serviço de autenticação não está disponível.' });
      setIsLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Login bem-sucedido!', description: 'Redirecionando para o seu portal...' });
      router.push('/portal-aluno');
    } catch (error: any) {
      const code = error?.code;
      let description = 'Verifique seu e-mail e senha e tente novamente.';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        description = 'E-mail ou senha incorretos. Esqueceu sua senha? Use o link abaixo.';
      } else if (code === 'auth/too-many-requests') {
        description = 'Muitas tentativas. Tente novamente em alguns minutos.';
      }
      toast({ variant: 'destructive', title: 'Erro no Login', description });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !resetEmail) return;
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({
        title: 'E-mail enviado!',
        description: `Enviamos um link de redefinição de senha para ${resetEmail}. Verifique também sua caixa de spam.`,
      });
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      const code = error?.code;
      let description = 'Não foi possível enviar o e-mail. Tente novamente.';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        description = 'E-mail não encontrado. Verifique e tente novamente.';
      }
      toast({ variant: 'destructive', title: 'Erro', description });
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="mb-8 flex flex-col items-center gap-2 text-primary">
          <h1 className="text-3xl font-bold">Krav Magá IPIRANGA</h1>
          <p className="text-muted-foreground">Portal do Aluno</p>
        </div>

        {noticesCount > 0 && (
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            <div className="relative shrink-0">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                {noticesCount > 9 ? '9+' : noticesCount}
              </span>
            </div>
            <p className="text-sm font-medium">
              {noticesCount === 1
                ? 'Há 1 aviso novo da academia. Faça login para ver.'
                : `Há ${noticesCount} avisos novos da academia. Faça login para ver.`}
            </p>
          </div>
        )}

        {!showForgotPassword ? (
          <form onSubmit={handleLogin}>
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Acesso do Aluno</CardTitle>
                <CardDescription>Faça login para ver suas informações.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(true); setResetEmail(email); }}
                  className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
                >
                  Esqueci minha senha
                </button>
              </CardFooter>
            </Card>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword}>
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Redefinir Senha</CardTitle>
                <CardDescription>
                  Digite o e-mail cadastrado e enviaremos um link para criar uma nova senha.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email cadastrado</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button className="w-full" type="submit" disabled={isSendingReset}>
                  {isSendingReset ? 'Enviando...' : 'Enviar link de redefinição'}
                </Button>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
                >
                  ← Voltar ao login
                </button>
              </CardFooter>
            </Card>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Ainda não tem cadastro?{' '}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Faça sua matrícula
          </Link>
        </p>
      </div>
    </div>
  );
}
