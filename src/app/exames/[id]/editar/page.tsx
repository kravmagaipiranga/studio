
'use client';

import { doc, collection } from "firebase/firestore";
import { useDoc, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Exam, Student } from "@/lib/types";
import { ExamForm } from "@/components/exams/exam-form";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function EditExamSkeleton() {
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

export default function EditExamPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const firestore = useFirestore();

  const examRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'exams', id);
  }, [firestore, id]);

  const studentsCollection = useMemoFirebase(() => {
      if (!firestore) return null;
      return collection(firestore, 'students');
  }, [firestore]);

  const { data: exam, isLoading: isLoadingExam } = useDoc<Exam>(examRef);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsCollection);

  const isLoading = isLoadingExam || isLoadingStudents;

  if (isLoading) {
    return <EditExamSkeleton />;
  }

  if (!isLoading && (!exam || !students)) {
     notFound();
  }

  return (
    <>
        <div className="flex items-center justify-between mb-4">
            <Link href={`/exames`}>
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Exames
                </Button>
            </Link>
        </div>
        <ExamForm exam={exam!} allStudents={students!} />
    </>
  );
}
