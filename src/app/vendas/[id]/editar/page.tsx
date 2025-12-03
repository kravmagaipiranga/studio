
'use client';

import { doc, collection } from "firebase/firestore";
import { useDoc, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Sale, Student } from "@/lib/types";
import { SaleForm } from "@/components/sales/sale-form";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function EditSaleSkeleton() {
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

export default function EditSalePage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();

  const saleRef = useMemoFirebase(() => {
    if (!firestore || !params.id) return null;
    return doc(firestore, 'sales', params.id);
  }, [firestore, params.id]);

  const studentsCollection = useMemoFirebase(() => {
      if (!firestore) return null;
      return collection(firestore, 'students');
  }, [firestore]);

  const { data: sale, isLoading: isLoadingSale } = useDoc<Sale>(saleRef);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsCollection);

  const isLoading = isLoadingSale || isLoadingStudents;

  if (isLoading) {
    return <EditSaleSkeleton />;
  }

  if (!sale || !students) {
     notFound();
  }

  return (
    <>
        <div className="flex items-center justify-between mb-4">
            <Link href={`/vendas`}>
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Vendas
                </Button>
            </Link>
        </div>
        <SaleForm sale={sale} allStudents={students} />
    </>
  );
}
