"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Save, Trash2, Copy } from "lucide-react"
import { PrivateClass } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { useFirestore, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "../ui/textarea"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { v4 as uuidv4 } from "uuid"


interface PrivateClassesTableProps {
  privateClasses: PrivateClass[]
  setPrivateClasses: React.Dispatch<React.SetStateAction<PrivateClass[]>>
  isLoading: boolean
}

export function PrivateClassesTable({ privateClasses, setPrivateClasses, isLoading }: PrivateClassesTableProps) {
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const handleInputChange = (classId: string, field: keyof PrivateClass, value: any) => {
    setPrivateClasses(prev =>
      prev.map(item => {
        if (item.id === classId) {
          const updatedItem = { ...item, [field]: value }

          if (field === 'numberOfClasses' || field === 'pricePerClass') {
              const numClasses = field === 'numberOfClasses' ? (Number(value) || 0) : item.numberOfClasses
              const price = field === 'pricePerClass' ? (Number(value) || 0) : item.pricePerClass
              updatedItem.paymentAmount = numClasses * price
          }
          return updatedItem
        }
        return item
      })
    )
  }
  
  const handleSaveClass = (itemToSave: PrivateClass) => {
    if (!firestore) return
    
    if (!itemToSave.studentName || !itemToSave.classDate || !itemToSave.classTime) {
        toast({
            variant: "destructive",
            title: "Campos Obrigatórios",
            description: "Por favor, preencha Nome do Aluno, Data e Horário da Aula antes de salvar."
        })
        return
    }

    const { isNew, id, ...itemData } = itemToSave
    const finalId = isNew ? doc(collection(firestore, "privateClasses")).id : id

    const docRef = doc(firestore, 'privateClasses', finalId)
    setDocumentNonBlocking(docRef, { ...itemData, id: finalId }, { merge: true })

    toast({
        title: "Aula Salva!",
        description: `A aula de ${itemData.studentName} foi salva com sucesso.`
    })
    
    setPrivateClasses(prev => prev.map(ex => ex.id === itemToSave.id ? { ...itemData, id: finalId, isNew: false } : ex))
  }

  const handleDuplicateClass = (e: React.MouseEvent, classToDuplicate: PrivateClass) => {
    e.stopPropagation()
    
    const newClass: PrivateClass = {
        ...classToDuplicate,
        id: `new_${uuidv4()}`,
        isNew: true,
        paymentStatus: 'Pendente',
        paymentDate: undefined,
        classDate: new Date().toISOString().split('T')[0],
    }

    setPrivateClasses(prev => [newClass, ...prev])

    toast({
        title: "Aula Duplicada!",
        description: "Uma nova aula foi criada com base na anterior. Ajuste a data e salve.",
    })
  }

  const handleDeleteClass = (e: React.MouseEvent, itemId: string, studentName: string) => {
    e.stopPropagation()
    if (!firestore) return
    
    const isNewRow = itemId.startsWith('new_')
    if (isNewRow) {
        setPrivateClasses(prev => prev.filter(ex => ex.id !== itemId))
        return
    }

    const docRef = doc(firestore, 'privateClasses', itemId)
    deleteDocumentNonBlocking(docRef)
    toast({
        title: "Aula Removida",
        description: `A aula de ${studentName} foi removida.`
    })
  }

  const getStatusVariant = (status: 'Pago' | 'Pendente'): 'default' | 'destructive' => {
      return status === 'Pago' ? 'default' : 'destructive'
  }

  if (isLoading) {
      return (
          <div className="space-y-2 w-full">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
          </div>
      )
  }

  return (
    <div className="w-full border rounded-lg overflow-hidden">
       {privateClasses.length > 0 ? (
        <Accordion type="single" collapsible className="w-full">
            {privateClasses.map((pc: PrivateClass) => (
                <AccordionItem value={pc.id} key={pc.id} className={cn("px-4", pc.isNew && "bg-muted/50")}>
                    <AccordionTrigger className="hover:no-underline py-3">
                        <div className="grid grid-cols-[1fr_auto] sm:grid-cols-4 gap-2 w-full pr-4 items-center">
                            <div className="text-left font-medium truncate">{pc.studentName || "Novo Registro"}</div>
                            <div className="hidden sm:block text-left text-muted-foreground truncate text-xs">
                              {new Date(pc.classDate + 'T00:00:00').toLocaleDateString('pt-BR')} às {pc.classTime}
                            </div>
                            <div className="text-left font-semibold text-blue-600 text-sm sm:text-base">
                              R$ {pc.paymentAmount.toFixed(2)}
                            </div>
                            <div className="text-right sm:text-left">
                                <Badge variant={getStatusVariant(pc.paymentStatus)} className="text-[10px] px-2 py-0">
                                  {pc.paymentStatus}
                                </Badge>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <label className="text-xs font-semibold text-muted-foreground">Aluno</label>
                               <Input 
                                  placeholder="Nome do Aluno"
                                  value={pc.studentName} 
                                  onChange={e => handleInputChange(pc.id, 'studentName', e.target.value)} 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground">Data da Aula</label>
                                    <Input type="date" value={pc.classDate} onChange={e => handleInputChange(pc.id, 'classDate', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground">Horário</label>
                                    <Input type="time" value={pc.classTime || ''} onChange={e => handleInputChange(pc.id, 'classTime', e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">Qtd Aulas</label>
                                <Input type="number" value={pc.numberOfClasses} onChange={e => handleInputChange(pc.id, 'numberOfClasses', parseInt(e.target.value, 10))} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">Valor/Aula (R$)</label>
                                <Input type="number" value={pc.pricePerClass} onChange={e => handleInputChange(pc.id, 'pricePerClass', parseFloat(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">Valor Total (R$)</label>
                                <Input type="number" value={pc.paymentAmount} disabled className="font-bold bg-muted" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                               <label className="text-xs font-semibold text-muted-foreground">Status do Pagamento</label>
                               <Select value={pc.paymentStatus} onValueChange={(value) => handleInputChange(pc.id, 'paymentStatus', value)}>
                                  <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Pago">Pago</SelectItem>
                                    <SelectItem value="Pendente">Pendente</SelectItem>
                                  </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                               <label className="text-xs font-semibold text-muted-foreground">Forma de Pagamento</label>
                               <Select value={pc.paymentMethod} onValueChange={(value) => handleInputChange(pc.id, 'paymentMethod', value)}>
                                  <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Pendente">Pendente</SelectItem>
                                    <SelectItem value="Pix">Pix</SelectItem>
                                    <SelectItem value="Boleto">Boleto</SelectItem>
                                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                  </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2 mt-4">
                            <label className="text-xs font-semibold text-muted-foreground">Anotações Gerais</label>
                            <Textarea 
                                placeholder="Observações sobre a aula ou o aluno..."
                                value={pc.notes || ""} 
                                onChange={e => handleInputChange(pc.id, 'notes', e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
                            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={(e) => handleDuplicateClass(e, pc)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicar
                            </Button>
                            <Button variant="destructive" size="sm" className="w-full sm:w-auto" onClick={(e) => handleDeleteClass(e, pc.id, pc.studentName)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                            </Button>
                            <Button size="sm" className="w-full sm:w-auto" onClick={() => handleSaveClass(pc)}>
                                <Save className="h-4 w-4 mr-2" />
                                Salvar
                            </Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
       ) : (
        <div className="text-center py-10 text-muted-foreground">
          Nenhuma aula particular agendada. Clique em "Agendar Aula" para adicionar uma.
        </div>
       )}
    </div>
  )
}