
import { StudentDetailContent } from "@/components/students/student-detail-content";

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return <StudentDetailContent studentId={id} />;
}
