"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Student } from "@/lib/types"
import { StudentForm } from "@/components/auth/registration-form"

interface StudentFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  student?: Student;
}

export function StudentFormDialog({
  isOpen,
  onOpenChange,
  student,
}: StudentFormDialogProps) {

  const handleFinished = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{student ? "Editar Aluno" : "Adicionar Aluno"}</DialogTitle>
          <DialogDescription>
            {student ? "Altere as informações abaixo para atualizar o cadastro." : "Preencha os dados para adicionar um novo aluno."}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <StudentForm student={student} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

    