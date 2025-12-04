'use client';

import { redirect } from 'next/navigation';

export default function NewStudentRedirectPage() {
    // Redirect to the actual edit page for creating a new student
    redirect('/alunos/novo/editar');
}
