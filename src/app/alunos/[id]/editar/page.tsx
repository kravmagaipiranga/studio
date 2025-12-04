
'use client';

import { doc } from "firebase/firestore";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { Student } from "@/lib/types";
import { StudentForm } from "@/components/students/student-form";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function EditStudentSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-44" />
            <div className="space-y-4 p-4 border rounded-lg">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        </div>
    );
}

export default function EditStudentPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const firestore = useFirestore();
  const router = useRouter();
  const isCreating = id === 'novo';

  const studentRef = useMemoFirebase(() => {
    if (!firestore || isCreating || !id) return null;
    return doc(firestore, 'students', id);
  }, [firestore, id, isCreating]);

  const { data: student, isLoading } = useDoc<Student>(studentRef);

  if (!isCreating && isLoading) {
    return <EditStudentSkeleton />;
  }

  if (!isCreating && !student && !isLoading) {
    notFound();
  }

  const handleFormSubmit = () => {
    router.push('/alunos');
  };

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
        <StudentForm student={student} onFormSubmit={handleFormSubmit} />
    </>
  );
}
