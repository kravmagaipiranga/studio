// This file is no longer used and can be deleted.
// For now, it will redirect to the students list page.
import { redirect } from 'next/navigation';

export default function StudentDetailPage() {
  redirect('/alunos');
}
