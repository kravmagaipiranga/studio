
'use client';
import { redirect, useParams } from 'next/navigation';

export default function StudentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  // This page can be used in the future to display student details.
  // For now, it redirects to the edit page to maintain the current UX.
  redirect(`/alunos/${id}/editar`);
}
