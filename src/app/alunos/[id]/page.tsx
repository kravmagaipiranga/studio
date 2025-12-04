'use client';
import { redirect } from 'next/navigation';

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  // This page can be used in the future to display student details.
  // For now, it redirects to the edit page to maintain the current UX.
  redirect(`/alunos/${params.id}/editar`);
}
