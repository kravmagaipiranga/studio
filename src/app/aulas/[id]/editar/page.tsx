
'use client';

import { doc, collection } from "firebase/firestore";
import { useDoc, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { PrivateClass, Student } from "@/lib/types";
import { PrivateClassForm } from "@/components/private-classes/private-class-form";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function EditPrivateClassSkeleton() {
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

export default function EditPrivateClassPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();

  const privateClassRef = useMemoFirebase(() => {
    if (!firestore || !params.id) return null;
    return doc(firestore, 'privateClasses', params.id);
  }, [firestore, params.id]);

  const studentsCollection = useMemoFirebase(() => {
      if (!firestore) return null;
      return collection(firestore, 'students');
  }, [firestore]);

  const { data: privateClass, isLoading: isLoadingClass } = useDoc<PrivateClass>(privateClassRef);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsCollection);

  const isLoading = isLoadingClass || isLoadingStudents;

  if (isLoading) {
    return <EditPrivateClassSkeleton />;
  }

  if (!privateClass || !students) {
     notFound();
  }

  return (
    <>
        <div className="flex items-center justify-between mb-4">
            <Link href={`/aulas`}>
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Aulas
                </Button>
            </Link>
        </div>
        <PrivateClassForm privateClass={privateClass} allStudents={students} />
    </>
  );
}
