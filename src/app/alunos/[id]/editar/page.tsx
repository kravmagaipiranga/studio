'use client';

import { doc } from "firebase/firestore";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { Student } from "@/lib/types";
import { StudentForm } from "@/components/auth/registration-form";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function EditStudentSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-36" />
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-6">
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <Skeleton className="h-10 w-full" />
            </div>
        </div>
    );
}

export default function EditStudentPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const firestore = useFirestore();

  const studentRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'students', id);
  }, [firestore, id]);

  const { data: student, isLoading } = useDoc<Student>(studentRef);

  if (isLoading) {
    return <EditStudentSkeleton />;
  }

  if (!student) {
    // This will trigger the not-found.tsx page if the student doesn't exist
    notFound();
  }

  return (
    <>
        <div className="flex items-center justify-between mb-4">
            <Link href={`/alunos`}>
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Alunos
                </Button>
            </Link>
        </div>
        <div className="w-full max-w-3xl mx-auto">
             <StudentForm student={student} />
        </div>
    </>
  );
}
