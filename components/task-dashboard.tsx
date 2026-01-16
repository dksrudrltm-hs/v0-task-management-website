"use client"

import { useState, useEffect } from "react"
import { supabase, type Task } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, Plus, LogOut, Calendar, LayoutGrid, Clock, AlertCircle, Sparkles, Kanban } from "lucide-react"
import { TaskForm } from "./task-form"
import { TaskList } from "./task-list"
import { CalendarView } from "./calendar-view"
import KanbanBoard from "./kanban-board"

interface TaskDashboardProps {
  workspaceId: string
  userId: string
  onLogout: () => void
  userNickname?: string
  userEmail?: string
}

export function TaskDashboard({ workspaceId, userId, onLogout, userNickname, userEmail }: TaskDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [view, setView] = useState<"dashboard" | "calendar" | "kanban">("dashboard")
  const [workspaceName, setWorkspaceName] = useState<string>("")

  useEffect(() => {
    fetchTasks()
    fetchWorkspace()
  }, [workspaceId])

  const fetchWorkspace = async () => {
    const { data } = await supabase.from("workspaces").select("name").eq("id", workspaceId).single()

    if (data) {
      setWorkspaceName(data.name)
    }
  }

  const fetchTasks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("due_date", { ascending: true, nullsFirst: false })

    if (!error && data) {
      setTasks(data)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout()
  }

  const handleTaskCreated = () => {
    setShowTaskForm(false)
    setEditingTask(undefined)
    fetchTasks()
  }

  const handleTaskDeleted = () => {
    fetchTasks()
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowTaskForm(true)
  }

  const todayTasks = tasks.filter((task) => {
    if (!task.due_date) return false
    const today = new Date()
    const dueDate = new Date(task.due_date)
    return dueDate.toDateString() === today.toDateString() && task.status !== "done"
  })

  const overdueTasks = tasks.filter((task) => {
    if (!task.due_date) return false
    const today = new Date()
    const dueDate = new Date(task.due_date)
    return dueDate < today && task.status !== "done"
  })

  const upcomingTasks = tasks.filter((task) => {
    if (!task.due_date) return false
    const today = new Date()
    const dueDate = new Date(task.due_date)
    const sevenDaysLater = new Date(today)
    sevenDaysLater.setDate(today.getDate() + 7)
    return dueDate > today && dueDate <= sevenDaysLater && task.status !== "done"
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50">
      <header className="border-b-2 border-teal-200 bg-white/80 backdrop-blur-md shadow-xl sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl ring-2 sm:ring-4 ring-teal-200 flex-shrink-0">
                <CalendarDays className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-blue-700 bg-clip-text text-transparent">
                  TaskFlow
                </h1>
                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 flex-wrap">
                  {userNickname && (
                    <span className="text-foreground font-semibold text-sm sm:text-base whitespace-nowrap">
                      {userNickname}님
                    </span>
                  )}
                  {workspaceName && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="font-medium truncate max-w-[100px] sm:max-w-none">{workspaceName}</span>
                    </>
                  )}
                  {userEmail && (
                    <>
                      <span className="hidden md:inline">•</span>
                      <span className="text-xs truncate max-w-[120px] sm:max-w-[200px] hidden md:inline">
                        {userEmail}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto overflow-x-auto">
              <Button
                variant={view === "dashboard" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("dashboard")}
                className={`shadow-md flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 ${
                  view === "dashboard"
                    ? "bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
                    : ""
                }`}
              >
                <LayoutGrid className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">대시보드</span>
              </Button>
              <Button
                variant={view === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("kanban")}
                className={`shadow-md flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 ${
                  view === "kanban"
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                    : ""
                }`}
              >
                <Kanban className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">칸반</span>
              </Button>
              <Button
                variant={view === "calendar" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("calendar")}
                className={`shadow-md flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 ${
                  view === "calendar"
                    ? "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                    : ""
                }`}
              >
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">캘린더</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="shadow-md border-2 border-orange-300 text-orange-700 hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-600 hover:text-white hover:border-orange-500 transition-all duration-300 bg-transparent flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">로그아웃</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {view === "dashboard" ? (
          <>
            <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-teal-600 to-blue-700 bg-clip-text text-transparent">
                대시보드
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
              <Card className="border-2 border-teal-200 shadow-2xl bg-gradient-to-br from-white to-teal-50 hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="pb-2 sm:pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs sm:text-sm font-bold text-teal-700 uppercase tracking-wider">
                      오늘 할 일
                    </CardTitle>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-4xl sm:text-5xl font-black text-teal-600">{todayTasks.length}</div>
                  <p className="text-xs sm:text-sm text-teal-700 mt-1 sm:mt-2 font-medium">오늘 완료해야 할 작업</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-rose-200 shadow-2xl bg-gradient-to-br from-white to-rose-50 hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="pb-2 sm:pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs sm:text-sm font-bold text-rose-700 uppercase tracking-wider">
                      지연된 할 일
                    </CardTitle>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-rose-500 to-rose-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                      <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-4xl sm:text-5xl font-black text-rose-600">{overdueTasks.length}</div>
                  <p className="text-xs sm:text-sm text-rose-700 mt-1 sm:mt-2 font-medium">기한이 지난 작업</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 shadow-2xl bg-gradient-to-br from-white to-purple-50 hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] sm:col-span-2 lg:col-span-1">
                <CardHeader className="pb-2 sm:pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs sm:text-sm font-bold text-purple-700 uppercase tracking-wider">
                      다가오는 할 일
                    </CardTitle>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-4xl sm:text-5xl font-black text-purple-600">{upcomingTasks.length}</div>
                  <p className="text-xs sm:text-sm text-purple-700 mt-1 sm:mt-2 font-medium">다음 7일 이내 작업</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-teal-600 to-blue-700 bg-clip-text text-transparent">
                내 할 일
              </h2>
              <Button
                onClick={() => setShowTaskForm(true)}
                size="lg"
                className="shadow-xl hover:shadow-2xl transition-all hover:scale-105 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />새 할 일 추가
              </Button>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4 sm:mb-6 bg-white shadow-xl p-1.5 h-auto border-2 border-teal-100 w-full grid grid-cols-4 gap-1">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-600 data-[state=active]:text-white font-semibold text-xs sm:text-sm"
                >
                  전체
                </TabsTrigger>
                <TabsTrigger
                  value="today"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white font-semibold text-xs sm:text-sm"
                >
                  오늘
                </TabsTrigger>
                <TabsTrigger
                  value="overdue"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-rose-600 data-[state=active]:text-white font-semibold text-xs sm:text-sm"
                >
                  지연
                </TabsTrigger>
                <TabsTrigger
                  value="upcoming"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white font-semibold text-xs sm:text-sm"
                >
                  다가오는
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <TaskList
                  tasks={tasks}
                  onTaskDeleted={handleTaskDeleted}
                  onEditTask={handleEditTask}
                  workspaceId={workspaceId}
                />
              </TabsContent>

              <TabsContent value="today" className="mt-4">
                <TaskList
                  tasks={todayTasks}
                  onTaskDeleted={handleTaskDeleted}
                  onEditTask={handleEditTask}
                  workspaceId={workspaceId}
                />
              </TabsContent>

              <TabsContent value="overdue" className="mt-4">
                <TaskList
                  tasks={overdueTasks}
                  onTaskDeleted={handleTaskDeleted}
                  onEditTask={handleEditTask}
                  workspaceId={workspaceId}
                />
              </TabsContent>

              <TabsContent value="upcoming" className="mt-4">
                <TaskList
                  tasks={upcomingTasks}
                  onTaskDeleted={handleTaskDeleted}
                  onEditTask={handleEditTask}
                  workspaceId={workspaceId}
                />
              </TabsContent>
            </Tabs>
          </>
        ) : view === "kanban" ? (
          <>
            <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <Kanban className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-purple-700 bg-clip-text text-transparent">
                칸반 보드
              </h2>
            </div>
            <KanbanBoard userId={userId} workspaceId={workspaceId} onEditTask={handleEditTask} onRefresh={fetchTasks} />
          </>
        ) : (
          <>
            <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-purple-600 to-indigo-700 bg-clip-text text-transparent">
                캘린더
              </h2>
            </div>
            <CalendarView
              tasks={tasks}
              workspaceId={workspaceId}
              userId={userId}
              onTaskCreated={handleTaskCreated}
              onTaskDeleted={handleTaskDeleted}
              onEditTask={handleEditTask}
            />
          </>
        )}
      </main>

      {showTaskForm && (
        <TaskForm
          workspaceId={workspaceId}
          userId={userId}
          task={editingTask}
          onClose={() => {
            setShowTaskForm(false)
            setEditingTask(undefined)
          }}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  )
}
