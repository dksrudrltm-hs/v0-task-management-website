"use client"

import type React from "react"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Clock, Calendar, Trash2, Edit, GripVertical } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string | null
  status: "backlog" | "todo" | "in_progress" | "done"
  priority: "low" | "medium" | "high" | null
  due_date: string | null
  start_time: string | null
  end_time: string | null
  kanban_order: number
}

interface KanbanBoardProps {
  userId: string
  workspaceId: string
  onEditTask: (task: Task) => void
  onRefresh: () => void
}

const COLUMNS = [
  { id: "backlog", title: "백로그", color: "bg-gray-100 border-gray-300", textColor: "text-gray-700" },
  { id: "todo", title: "할 일", color: "bg-blue-100 border-blue-300", textColor: "text-blue-700" },
  { id: "in_progress", title: "진행 중", color: "bg-yellow-100 border-yellow-300", textColor: "text-yellow-700" },
  { id: "done", title: "완료", color: "bg-green-100 border-green-300", textColor: "text-green-700" },
] as const

export default function KanbanBoard({ userId, workspaceId, onEditTask, onRefresh }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [draggedOver, setDraggedOver] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch tasks on mount
  useState(() => {
    fetchTasks()
  })

  async function fetchTasks() {
    setLoading(true)
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("kanban_order", { ascending: true })

    if (!error && data) {
      setTasks(data as Task[])
    }
    setLoading(false)
  }

  async function updateTaskStatus(taskId: string, newStatus: Task["status"], newOrder: number) {
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus, kanban_order: newOrder })
      .eq("id", taskId)

    if (!error) {
      await fetchTasks()
      onRefresh()
    }
  }

  async function deleteTask(taskId: string) {
    if (confirm("이 작업을 삭제하시겠습니까?")) {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId)

      if (!error) {
        await fetchTasks()
        onRefresh()
      }
    }
  }

  function handleDragStart(task: Task) {
    setDraggedTask(task)
  }

  function handleDragOver(e: React.DragEvent, columnId: string) {
    e.preventDefault()
    setDraggedOver(columnId)
  }

  function handleDragLeave() {
    setDraggedOver(null)
  }

  async function handleDrop(e: React.DragEvent, columnId: Task["status"]) {
    e.preventDefault()
    setDraggedOver(null)

    if (draggedTask && draggedTask.status !== columnId) {
      // Get max order in target column
      const tasksInColumn = tasks.filter((t) => t.status === columnId)
      const maxOrder = tasksInColumn.length > 0 ? Math.max(...tasksInColumn.map((t) => t.kanban_order)) : 0

      await updateTaskStatus(draggedTask.id, columnId, maxOrder + 1)
    }
    setDraggedTask(null)
  }

  function getTasksByStatus(status: Task["status"]) {
    return tasks.filter((task) => task.status === status)
  }

  function getPriorityColor(priority: Task["priority"]) {
    switch (priority) {
      case "high":
        return "border-l-4 border-l-rose-500 bg-rose-50"
      case "medium":
        return "border-l-4 border-l-amber-500 bg-amber-50"
      case "low":
        return "border-l-4 border-l-blue-500 bg-blue-50"
      default:
        return "border-l-4 border-l-gray-300 bg-white"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">칸반 보드 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto lg:overflow-x-auto lg:overflow-y-hidden">
      <div className="flex flex-col lg:flex-row gap-4 p-4 lg:min-w-max">
        {COLUMNS.map((column) => {
          const columnTasks = getTasksByStatus(column.id as Task["status"])
          const isDraggedOver = draggedOver === column.id

          return (
            <div key={column.id} className="w-full lg:flex-1 lg:min-w-[280px] lg:max-w-[400px]">
              {/* Column Header */}
              <div
                className={`${column.color} ${column.textColor} rounded-t-xl border-2 px-4 py-3 font-bold text-lg shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <span>{column.title}</span>
                  <span className={`${column.textColor} bg-white px-3 py-1 rounded-full text-sm font-bold shadow-sm`}>
                    {columnTasks.length}
                  </span>
                </div>
              </div>

              {/* Column Content */}
              <div
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id as Task["status"])}
                className={`min-h-[200px] lg:min-h-[400px] lg:max-h-[calc(100vh-300px)] lg:overflow-y-auto bg-gray-50 border-2 border-t-0 ${column.color.split(" ")[1]} rounded-b-xl p-3 space-y-3 transition-all ${
                  isDraggedOver ? "bg-gradient-to-b from-teal-100 to-blue-100 shadow-2xl scale-[1.02]" : ""
                }`}
              >
                {columnTasks.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-sm">작업이 없습니다</p>
                    <p className="text-xs mt-1">여기로 드래그하세요</p>
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      className={`${getPriorityColor(task.priority)} rounded-lg p-4 shadow-md hover:shadow-xl cursor-move transition-all transform hover:scale-[1.02] active:scale-95 group`}
                    >
                      {/* Task Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <h3 className="font-bold text-gray-900 break-words flex-1 leading-snug">{task.title}</h3>
                        </div>
                        <div className="flex gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={() => onEditTask(task)}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Task Description */}
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2 break-words">{task.description}</p>
                      )}

                      {/* Task Metadata */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {task.due_date && (
                          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-gray-200">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-700 font-medium whitespace-nowrap">
                              {new Date(task.due_date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        )}
                        {task.start_time && task.end_time && (
                          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-gray-200">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-700 font-medium whitespace-nowrap">
                              {task.start_time.slice(0, 5)} - {task.end_time.slice(0, 5)}
                            </span>
                          </div>
                        )}
                        {task.priority && (
                          <div
                            className={`px-2 py-1 rounded-md font-semibold border whitespace-nowrap ${
                              task.priority === "high"
                                ? "bg-rose-100 text-rose-700 border-rose-300"
                                : task.priority === "medium"
                                  ? "bg-amber-100 text-amber-700 border-amber-300"
                                  : "bg-blue-100 text-blue-700 border-blue-300"
                            }`}
                          >
                            {task.priority === "high" ? "높음" : task.priority === "medium" ? "보통" : "낮음"}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
