
'use client';

import { useState, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Task = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: any; // Firestore timestamp
};

export default function ListaDeTarefasPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [newTaskText, setNewTaskText] = useState('');

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tasks'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: tasks, isLoading } = useCollection<Task>(tasksQuery);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !newTaskText.trim()) return;

    const taskData = {
      text: newTaskText.trim(),
      completed: false,
      createdAt: serverTimestamp(),
    };

    try {
      await addDocumentNonBlocking(collection(firestore, 'tasks'), taskData);
      setNewTaskText('');
      toast({
        title: 'Tarefa Adicionada!',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao adicionar tarefa',
      });
    }
  };

  const handleToggleTask = (task: Task) => {
    if (!firestore) return;
    const taskRef = doc(firestore, 'tasks', task.id);
    updateDocumentNonBlocking(taskRef, { completed: !task.completed });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!firestore) return;
    const taskRef = doc(firestore, 'tasks', taskId);
    deleteDocumentNonBlocking(taskRef);
    toast({
      title: 'Tarefa removida.',
    });
  };

  const pendingTasks = useMemo(
    () => tasks?.filter((t) => !t.completed) || [],
    [tasks]
  );
  const completedTasks = useMemo(
    () => tasks?.filter((t) => t.completed) || [],
    [tasks]
  );

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Lista de Tarefas</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova Tarefa</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTask} className="flex items-center gap-2">
            <Input
              placeholder="O que precisa ser feito?"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
            />
            <Button type="submit" disabled={!newTaskText.trim()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-md font-semibold">Pendentes</h3>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : pendingTasks.length > 0 ? (
          pendingTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma tarefa pendente. Ótimo trabalho!</p>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-semibold">Concluídas</h3>
        {isLoading ? (
           <Skeleton className="h-12 w-full" />
        ) : completedTasks.length > 0 ? (
          completedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma tarefa concluída ainda.</p>
        )}
      </div>
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <Checkbox
        id={`task-${task.id}`}
        checked={task.completed}
        onCheckedChange={() => onToggle(task)}
        aria-label={`Marcar como ${task.completed ? 'pendente' : 'concluída'}`}
      />
      <label
        htmlFor={`task-${task.id}`}
        className={cn(
          'flex-1 text-sm font-medium cursor-pointer',
          task.completed && 'text-muted-foreground line-through'
        )}
      >
        {task.text}
      </label>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(task.id)}
        aria-label="Excluir tarefa"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
