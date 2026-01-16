"use client"

import { type Task, supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Pencil, Trash2, Clock, Calendar } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface TaskListProps {
  tasks: Task[]
  onTaskDeleted: () => void
  onEditTask: (task: Task) => void
  workspaceId: string
}

export function TaskList({ tasks, onTaskDeleted, onEditTask, workspaceId }: TaskListProps) {
  const handleDelete = async (taskId: string) => {
    await supabase.from("tasks").delete().eq("id", taskId)
    onTaskDeleted()
  }

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done"
    await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id)
    onTaskDeleted()
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-600 dark:text-red-400"
      case "medium":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
      case "low":
        return "bg-green-500/10 text-green-600 dark:text-green-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "done":
        return <Badge variant="secondary">완료</Badge>
      case "in_progress":
        return <Badge>진행 중</Badge>
      default:
        return <Badge variant="outline">할 일</Badge>
    }
  }

  if (tasks.length === 0) {
    return (
      <Card className="bg-gray-50 border-2">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">할 일이 없습니다.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-3 p-3 sm:p-6 bg-gray-50/50 rounded-xl border-2 border-gray-100">
      {tasks.map((task) => (
        <Card key={task.id} className="bg-white border-2 shadow-md hover:shadow-xl transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-4">
              <Checkbox
                checked={task.status === "done"}
                onCheckedChange={() => handleToggleStatus(task)}
                className="mt-1 flex-shrink-0"
              />
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-2">
                  <h3
                    className={`font-medium break-words text-sm sm:text-base ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}
                  >
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap flex-shrink-0">
                    {getStatusBadge(task.status)}
                    {task.priority && (
                      <Badge className={getPriorityColor(task.priority)} variant="outline">
                        {task.priority === "high" ? "높음" : task.priority === "medium" ? "보통" : "낮음"}
                      </Badge>
                    )}
                  </div>
                </div>

                {task.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 break-words">
                    {task.description}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  {task.due_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">{new Date(task.due_date).toLocaleDateString("ko-KR")}</span>
                    </div>
                  )}
                  {task.start_time && task.end_time && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">
                        {task.start_time} - {task.end_time}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex sm:flex-row flex-col items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={() => onEditTask(task)} className="h-8 w-8 sm:h-9 sm:w-9">
                  <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>할 일 삭제</AlertDialogTitle>
                      <AlertDialogDescription>
                        이 할 일을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(task.id)}>삭제</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
