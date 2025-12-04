'use client';
import { redirect } from 'next/navigation';

export default function NewSeminarRedirectPage() {
    redirect('/seminarios/novo/editar');
}
