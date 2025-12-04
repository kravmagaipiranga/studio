
'use client';

import { doc, collection } from "firebase/firestore";
import { useDoc, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { PrivateClass, Student } from "@/lib/types";
import { PrivateClassForm } from "@/components/private-classes/private-class-form";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound, useParams } from "next/navigation";
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

export default function EditPrivateClassPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const isCreating = id === 'novo';

  const privateClassRef = useMemoFirebase(() => {
    if (!firestore || isCreating || !id) return null;
    return doc(firestore, 'privateClasses', id);
  }, [firestore, id, isCreating]);

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

  if (!isCreating && !isLoadingClass && !privateClass) {
     notFound();
  }

  return (
    <>
        <div className="flex items-center justify-between mb-4">
            <Link href="/aulas">
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Aulas
                </Button>
            </Link>
        </div>
        <PrivateClassForm privateClass={privateClass} allStudents={students || []} isEditing={!isCreating} />
    </>
  );
}
