
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
            <Skeleton className="h-10 w-44" />
            <div className="space-y-2">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    );
}

export function EditStudentFormWrapper({ studentId }: { studentId: string }) {
  const firestore = useFirestore();

  const studentRef = useMemoFirebase(() => {
    if (!firestore || !studentId) return null;
    return doc(firestore, 'students', studentId);
  }, [firestore, studentId]);

  const { data: student, isLoading } = useDoc<Student>(studentRef);

  if (isLoading) {
    return <EditStudentSkeleton />;
  }

  if (!student) {
    notFound();
  }

  return (
    <>
        <div className="flex items-center justify-between mb-4">
            <Link href={`/alunos/${studentId}`}>
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Detalhes
                </Button>
            </Link>
        </div>
        <StudentForm student={student} />
    </>
  );
}
