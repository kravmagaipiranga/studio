'use client';
import { redirect } from 'next/navigation';

export default function NewPrivateClassRedirectPage() {
    redirect('/aulas/novo/editar');
}
