
'use client';

import { doc } from "firebase/firestore";
import { notFound } from "next/navigation";

import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { Student } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentForm } from "@/components/students/student-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function EditStudentSkeleton() {
    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
    );
}

export default function EditStudentPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const firestore = useFirestore();

    const studentRef = useMemoFirebase(() => {
        if (!firestore || !id) return null;
        return doc(firestore, "students", id);
    }, [firestore, id]);

    const { data: student, isLoading } = useDoc<Student>(studentRef);

    if (isLoading) {
        return <EditStudentSkeleton />;
    }

    if (!isLoading && !student) {
        notFound();
    }
    
    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <Link href="/alunos">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para Alunos
                    </Button>
                </Link>
            </div>
            <Card className="w-full max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Editar Aluno</CardTitle>
                    <CardDescription>Edite os dados do aluno.</CardDescription>
                </CardHeader>
                <CardContent>
                    <StudentForm student={student} isEditing={true} />
                </CardContent>
            </Card>
        </>
    );
}
