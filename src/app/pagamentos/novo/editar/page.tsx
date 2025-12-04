
'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Student } from "@/lib/types";
import { RegisterPaymentForm } from "@/components/payments/register-payment-form";
import { Skeleton } from "@/components/ui/skeleton";
import { collection } from "firebase/firestore";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";


export default function NewPaymentPage() {
    const firestore = useFirestore();
    const searchParams = useSearchParams();
    const studentId = searchParams.get('aluno');

    const studentsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'students');
    }, [firestore]);

    const { data: students, isLoading } = useCollection<Student>(studentsCollection);

    if (isLoading) {
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
        )
    }

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <Link href="/pagamentos">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para Pagamentos
                    </Button>
                </Link>
            </div>
            <RegisterPaymentForm allStudents={students || []} studentIdFromUrl={studentId} />
        </>
    )
}
