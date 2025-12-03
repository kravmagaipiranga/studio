
'use client';

import { doc, collection } from "firebase/firestore";
import { useDoc, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Seminar, Student } from "@/lib/types";
import { SeminarForm } from "@/components/seminars/seminar-form";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function EditSeminarSkeleton() {
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

export default function EditSeminarPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();

  const seminarRef = useMemoFirebase(() => {
    if (!firestore || !params.id) return null;
    return doc(firestore, 'seminars', params.id);
  }, [firestore, params.id]);

  const studentsCollection = useMemoFirebase(() => {
      if (!firestore) return null;
      return collection(firestore, 'students');
  }, [firestore]);

  const { data: seminar, isLoading: isLoadingSeminar } = useDoc<Seminar>(seminarRef);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsCollection);

  const isLoading = isLoadingSeminar || isLoadingStudents;

  if (isLoading) {
    return <EditSeminarSkeleton />;
  }

  if (!seminar || !students) {
     notFound();
  }

  return (
    <>
        <div className="flex items-center justify-between mb-4">
            <Link href={`/seminarios`}>
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Seminários
                </Button>
            </Link>
        </div>
        <SeminarForm seminar={seminar} allStudents={students} />
    </>
  );
}
