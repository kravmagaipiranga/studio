"use client";

import { doc } from "firebase/firestore";
import { notFound } from "next/navigation";

import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { Student } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentForm } from "@/components/auth/registration-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function EditStudentSkeleton() {
    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    );
}

export default function EditStudentPage({ params }: { params: { id: string } }) {

    const { id } = params;
    const firestore = useFirestore();

    const isCreating = id === "novo";

    const studentRef = useMemoFirebase(() => {
        if (!firestore || isCreating) return null;
        return doc(firestore, "students", id);
    }, [firestore, id, isCreating]);

    const { data: student, isLoading } = useDoc<Student>(studentRef);

    if (isLoading) return <EditStudentSkeleton />;

    if (!isCreating && !student) notFound();

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>{isCreating ? "Adicionar Novo Aluno" : "Editar Aluno"}</CardTitle>
                <CardDescription>
                    {isCreating ? "Crie um novo cadastro." : "Edite os dados do aluno."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <StudentForm student={student} />
            </CardContent>
        </Card>
    );
}
