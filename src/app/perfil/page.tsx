
'use client';

import { useUser } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PerfilPage() {
    const { user } = useUser();

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Perfil do Administrador</h1>
            </div>
            <div className="flex flex-1 rounded-lg shadow-sm mt-4">
               <Card className="w-full max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>Suas Informações</CardTitle>
                        <CardDescription>Gerencie as informações da sua conta.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={user?.photoURL || "https://picsum.photos/seed/admin/100/100"} data-ai-hint="person face" />
                                <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
                            </Avatar>
                            <Button variant="outline">Alterar Foto</Button>
                        </div>

                         <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={user?.email || ''} disabled />
                            <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
                        </div>
                        
                         <div className="space-y-2">
                            <Label htmlFor="name">Nome (Exibição)</Label>
                            <Input id="name" type="text" placeholder="Seu nome" defaultValue={user?.displayName || ''} />
                        </div>
                        
                        <div className="border-t pt-6 space-y-4">
                            <h3 className="text-md font-semibold">Alterar Senha</h3>
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Senha Atual</Label>
                                <Input id="current-password" type="password" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="new-password">Nova Senha</Label>
                                <Input id="new-password" type="password" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                                <Input id="confirm-password" type="password" />
                            </div>
                        </div>

                        <Button>Salvar Alterações</Button>

                    </CardContent>
               </Card>
            </div>
        </>
    )
}
