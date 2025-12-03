
'use client';

import { doc } from "firebase/firestore";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { Appointment } from "@/lib/types";
import { AppointmentForm } from "@/components/appointments/appointment-form";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function EditAppointmentSkeleton() {
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

export default function EditAppointmentPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const firestore = useFirestore();

  const appointmentRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'appointments', id);
  }, [firestore, id]);

  const { data: appointment, isLoading } = useDoc<Appointment>(appointmentRef);

  if (isLoading) {
    return <EditAppointmentSkeleton />;
  }

  if (!isLoading && !appointment) {
    notFound();
  }

  return (
    <>
        <div className="flex items-center justify-between mb-4">
            <Link href={`/agendamentos`}>
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Agendamentos
                </Button>
            </Link>
        </div>
        {appointment && <AppointmentForm appointment={appointment} />}
    </>
  );
}
