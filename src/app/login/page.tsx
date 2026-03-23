'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Erro de Autenticação',
        description: 'O serviço de autenticação não está disponível.',
      });
      setIsLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Login bem-sucedido!',
        description: 'Redirecionando para o painel...',
      });
      router.push('/dashboard');
    } catch (error: any) {
      const code = error?.code || '';
      let description = 'Verifique seu e-mail e senha.';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        description = 'E-mail ou senha incorretos.';
      } else if (code === 'auth/invalid-email') {
        description = 'Endereço de e-mail inválido.';
      } else if (code === 'auth/user-disabled') {
        description = 'Este usuário está desativado.';
      } else if (code === 'auth/too-many-requests') {
        description = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
      } else if (code === 'auth/network-request-failed') {
        description = 'Erro de rede. Verifique sua conexão.';
      } else if (code === 'auth/unauthorized-domain') {
        description = 'Este domínio não está autorizado no Firebase. Adicione-o em Authentication → Settings → Authorized domains.';
      } else if (code) {
        description = `Erro: ${code}`;
      }
      toast({
        variant: 'destructive',
        title: 'Erro no Login',
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="mb-8 flex flex-col items-center gap-2 text-primary">
          <h1 className="text-3xl font-bold">Krav Magá IPIRANGA</h1>
          <p className="text-muted-foreground">Painel de Gestão</p>
        </div>
        <form onSubmit={handleLogin}>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Acesso Restrito</CardTitle>
              <CardDescription>
                Faça login para gerenciar o sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@kravmaga.com.br"
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
            <CardFooter>
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
