'use client';

import { useState, useEffect, useRef } from "react";
import { useUser, useAuth, useStorage } from "@/firebase";
import { updateProfile } from "firebase/auth";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function PerfilPage() {
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const storage = useStorage(); 
    const { toast } = useToast();

    const [displayName, setDisplayName] = useState('');
    const [newPhoto, setNewPhoto] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setNewPhoto(user.photoURL || null);
        }
    }, [user]);

    const handlePhotoChangeClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setNewPhoto(dataUrl);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveChanges = async () => {
        if (!user || !auth || !storage) {
             toast({
                variant: "destructive",
                title: "Erro",
                description: "Usuário não autenticado ou serviço indisponível. Faça login novamente.",
            });
            return;
        }

        setIsSaving(true);
        try {
            let photoURL = user.photoURL;

            // Se uma nova foto foi selecionada (e não é a URL antiga)
            if (newPhoto && newPhoto !== user.photoURL) {
                const storageRef = ref(storage, `avatars/${user.uid}/profile.jpg`);
                
                // O newPhoto é um data URL (base64)
                const snapshot = await uploadString(storageRef, newPhoto, 'data_url');
                photoURL = await getDownloadURL(snapshot.ref);
            }

            // Atualiza o perfil
            await updateProfile(user, {
                displayName: displayName,
                photoURL: photoURL,
            });

            toast({
                title: "Perfil Atualizado!",
                description: "Suas informações foram salvas com sucesso.",
            });

        } catch (error) {
             console.error("Erro ao salvar perfil: ", error);
             toast({
                variant: "destructive",
                title: "Erro ao Salvar",
                description: "Não foi possível atualizar seu perfil. Tente novamente.",
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isUserLoading || !user) {
        return (
             <div className="flex flex-1 rounded-lg mt-4">
               <Card className="w-full max-w-2xl mx-auto">
                    <CardHeader>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-72" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                           <Skeleton className="h-20 w-20 rounded-full" />
                           <Skeleton className="h-10 w-32" />
                        </div>
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-16" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-32" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                         <Skeleton className="h-10 w-40" />
                    </CardContent>
               </Card>
            </div>
        )
    }

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
                                <AvatarImage src={newPhoto || "https://picsum.photos/seed/admin/100/100"} data-ai-hint="person face" />
                                <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
                            </Avatar>
                            <Button variant="outline" onClick={handlePhotoChangeClick}>Alterar Foto</Button>
                            <input 
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/png, image/jpeg"
                                onChange={handleFileChange}
                            />
                        </div>

                         <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={user?.email || ''} disabled />
                            <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
                        </div>
                        
                         <div className="space-y-2">
                            <Label htmlFor="name">Nome (Exibição)</Label>
                            <Input 
                                id="name" 
                                type="text" 
                                placeholder="Seu nome" 
                                value={displayName} 
                                onChange={(e) => setDisplayName(e.target.value)} 
                            />
                        </div>
                        
                        <div className="border-t pt-6 space-y-4">
                            <h3 className="text-md font-semibold">Alterar Senha</h3>
                             <p className="text-sm text-muted-foreground">
                                Funcionalidade para alterar a senha será implementada em breve. Por enquanto, utilize o painel do Firebase se necessário.
                            </p>
                        </div>

                        <Button onClick={handleSaveChanges} disabled={isSaving}>
                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>

                    </CardContent>
               </Card>
            </div>
        </>
    )
}
