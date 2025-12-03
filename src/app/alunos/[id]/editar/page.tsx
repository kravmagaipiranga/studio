
import { EditStudentFormWrapper } from "@/components/students/edit-student-form-wrapper";

export default async function EditStudentPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return <EditStudentFormWrapper studentId={id} />;
}
