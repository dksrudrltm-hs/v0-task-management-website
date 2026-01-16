"use client"

import { useState, useEffect } from "react"
import { type Task, supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Pencil,
  Trash2,
  Clock,
  Calendar,
  Paperclip,
  Download,
  X,
  Loader2,
  File,
  FileImage,
  FileText,
} from "lucide-react"
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

interface Attachment {
  id: string
  task_id: string
  user_id: string
  file_name: string
  file_size: number
  file_type: string
  storage_path: string
  created_at: string
}

export function TaskList({ tasks, onTaskDeleted, onEditTask, workspaceId }: TaskListProps) {
  const [taskAttachments, setTaskAttachments] = useState<Record<string, Attachment[]>>({})
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null)
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string | null>(null)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)

  useEffect(() => {
    loadAttachments()
  }, [tasks])

  const loadAttachments = async () => {
    const taskIds = tasks.map((t) => t.id)
    if (taskIds.length === 0) {
      setTaskAttachments({})
      return
    }

    console.log("[v0] Loading attachments for tasks:", taskIds.length)

    const { data, error } = await supabase
      .from("task_attachments")
      .select("*")
      .in("task_id", taskIds)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error loading attachments:", error)
      return
    }

    if (data) {
      const attachmentsByTask: Record<string, Attachment[]> = {}
      data.forEach((att) => {
        if (!attachmentsByTask[att.task_id]) {
          attachmentsByTask[att.task_id] = []
        }
        attachmentsByTask[att.task_id].push(att)
      })
      console.log("[v0] Attachments loaded:", attachmentsByTask)
      setTaskAttachments(attachmentsByTask)
    }
  }

  const handleDownloadAttachment = async (attachment: Attachment) => {
    setDownloadingAttachmentId(attachment.id)
    try {
      console.log("[v0] Downloading file:", attachment.storage_path)
      const { data, error } = await supabase.storage.from("task-attachments").download(attachment.storage_path)

      if (error) {
        console.error("[v0] Download error:", error)
        alert("파일 다운로드에 실패했습니다.")
        return
      }

      const url = URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = attachment.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      console.log("[v0] Download complete:", attachment.file_name)
    } catch (err) {
      console.error("[v0] Download error:", err)
      alert("파일 다운로드 중 오류가 발생했습니다.")
    } finally {
      setDownloadingAttachmentId(null)
    }
  }

  const handleDeleteAttachment = async (attachment: Attachment) => {
    if (!confirm(`"${attachment.file_name}" 파일을 삭제하시겠습니까?`)) return

    setDeletingAttachmentId(attachment.id)
    try {
      console.log("[v0] Deleting file:", attachment.storage_path)

      const { error: storageError } = await supabase.storage.from("task-attachments").remove([attachment.storage_path])

      if (storageError) {
        console.error("[v0] Storage delete error:", storageError)
      }

      const { error: dbError } = await supabase.from("task_attachments").delete().eq("id", attachment.id)

      if (dbError) {
        console.error("[v0] Database delete error:", dbError)
        alert("파일 삭제에 실패했습니다.")
        return
      }

      console.log("[v0] File deleted successfully")
      await loadAttachments()
    } catch (err) {
      console.error("[v0] Delete error:", err)
      alert("파일 삭제 중 오류가 발생했습니다.")
    } finally {
      setDeletingAttachmentId(null)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <FileImage className="w-4 h-4 text-blue-500" />
    if (fileType === "application/pdf") return <FileText className="w-4 h-4 text-red-500" />
    return <File className="w-4 h-4 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

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
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-300"
      case "medium":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-300"
      case "low":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-300"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "done":
        return (
          <Badge variant="secondary" className="bg-gray-200 text-gray-700">
            완료
          </Badge>
        )
      case "in_progress":
        return <Badge className="bg-blue-500 text-white">진행 중</Badge>
      case "backlog":
        return (
          <Badge variant="outline" className="text-purple-600 border-purple-300">
            백로그
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-teal-600 border-teal-300">
            할 일
          </Badge>
        )
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
      {tasks.map((task) => {
        const attachments = taskAttachments[task.id] || []
        const isExpanded = expandedTaskId === task.id

        return (
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

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                    {(task.start_date || task.due_date) && (
                      <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg px-3 py-1.5">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-purple-600" />
                        <div className="font-bold text-purple-700">
                          {task.end_date && task.start_date !== task.end_date ? (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                              <span className="whitespace-nowrap">
                                {new Date(task.start_date || task.due_date!).toLocaleDateString("ko-KR", {
                                  month: "short",
                                  day: "numeric",
                                })}
                                {task.start_time && (
                                  <span className="text-teal-600 ml-1 text-xs font-black">{task.start_time}</span>
                                )}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className="whitespace-nowrap">
                                {new Date(task.end_date).toLocaleDateString("ko-KR", {
                                  month: "short",
                                  day: "numeric",
                                })}
                                {task.end_time && (
                                  <span className="text-rose-600 ml-1 text-xs font-black">{task.end_time}</span>
                                )}
                              </span>
                            </div>
                          ) : (
                            <span className="whitespace-nowrap">
                              {new Date(task.start_date || task.due_date!).toLocaleDateString("ko-KR", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                weekday: "short",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {task.start_time && task.end_time && (!task.end_date || task.start_date === task.end_date) && (
                      <div className="flex items-center gap-1.5 bg-gradient-to-r from-teal-50 to-blue-50 border-2 border-teal-200 rounded-lg px-3 py-1.5">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-teal-600" />
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-teal-700 whitespace-nowrap">{task.start_time}</span>
                          <span className="text-gray-400 font-bold">→</span>
                          <span className="font-bold text-rose-600 whitespace-nowrap">{task.end_time}</span>
                        </div>
                      </div>
                    )}
                    {attachments.length > 0 && (
                      <button
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 font-bold transition-colors bg-teal-50 border-2 border-teal-200 hover:border-teal-300 rounded-lg px-3 py-1.5"
                      >
                        <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="whitespace-nowrap">{attachments.length}개</span>
                      </button>
                    )}
                  </div>

                  {isExpanded && attachments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                      <div className="text-xs font-semibold text-gray-600 mb-2">첨부파일 목록</div>
                      {attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 hover:border-teal-300 transition-colors"
                        >
                          <div className="flex-shrink-0">{getFileIcon(attachment.file_type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate" title={attachment.file_name}>
                              {attachment.file_name}
                            </p>
                            <p className="text-[10px] text-gray-500">{formatFileSize(attachment.file_size)}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-teal-600 hover:text-teal-700 hover:bg-teal-100"
                              onClick={() => handleDownloadAttachment(attachment)}
                              disabled={downloadingAttachmentId === attachment.id}
                              title="다운로드"
                            >
                              {downloadingAttachmentId === attachment.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Download className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-100"
                              onClick={() => handleDeleteAttachment(attachment)}
                              disabled={deletingAttachmentId === attachment.id}
                              title="삭제"
                            >
                              {deletingAttachmentId === attachment.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <X className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex sm:flex-row flex-col items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditTask(task)}
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
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
        )
      })}
    </div>
  )
}
