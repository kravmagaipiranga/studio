
'use client';

import { doc, collection } from "firebase/firestore";
import { useDoc, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Sale, Student } from "@/lib/types";
import { SaleForm } from "@/components/sales/sale-form";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

function EditSaleSkeleton() {
    return (
        <Card className="w-full max-w-xl mx-auto">
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Skeleton className="h-10 w-full mt-4" />
            </CardContent>
        </Card>
    );
}

export default function EditSalePage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const isCreating = id === 'novo';

  const saleRef = useMemoFirebase(() => {
    if (!firestore || isCreating || !id) return null;
    return doc(firestore, 'sales', id);
  }, [firestore, id, isCreating]);

  const studentsCollection = useMemoFirebase(() => {
      if (!firestore) return null;
      return collection(firestore, 'students');
  }, [firestore]);

  const { data: sale, isLoading: isLoadingSale } = useDoc<Sale>(saleRef);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsCollection);

  const isLoading = isLoadingSale || isLoadingStudents;

  if (!isCreating && !sale && !isLoading) {
     notFound();
  }

  return (
    <>
        <div className="flex items-center justify-between mb-4">
            <Link href="/vendas">
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Vendas
                </Button>
            </Link>
        </div>
        {isLoading ? (
            <EditSaleSkeleton />
        ) : (
            <SaleForm 
                sale={sale} 
                allStudents={students || []} 
                isEditing={!isCreating} 
            />
        )}
    </>
  );
}
