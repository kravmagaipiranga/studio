
'use client';

import { AppointmentForm } from "@/components/appointments/appointment-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewAppointmentPage() {
    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <Link href="/agendamentos">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para Agendamentos
                    </Button>
                </Link>
            </div>
            <AppointmentForm />
        </>
    );
}
