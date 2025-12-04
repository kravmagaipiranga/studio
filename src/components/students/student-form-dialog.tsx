
"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Student } from "@/lib/types"
import { StudentForm } from "@/components/students/student-form"

interface StudentFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  student?: Student | null;
  onFormSubmit: () => void;
}

export function StudentFormDialog({
  isOpen,
  onOpenChange,
  student,
  onFormSubmit,
}: StudentFormDialogProps) {

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{student ? "Editar Aluno" : "Adicionar Novo Aluno"}</DialogTitle>
          <DialogDescription>
            {student ? "Altere as informações abaixo para atualizar o cadastro." : "Preencha os dados para adicionar um novo aluno."}
          </DialogDescription>
        </DialogHeader>
        <StudentForm student={student} onFormSubmit={onFormSubmit} />
      </DialogContent>
    </Dialog>
  )
}
