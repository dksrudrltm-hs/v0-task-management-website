"use client"

import { useState } from "react"
import type { Task } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { TaskForm } from "./task-form"
import { TaskList } from "./task-list"

interface CalendarViewProps {
  tasks: Task[]
  workspaceId: string
  userId: string
  onTaskCreated: () => void
  onTaskDeleted: () => void
  onEditTask: (task: Task) => void
}

export function CalendarView({
  tasks,
  workspaceId,
  userId,
  onTaskCreated,
  onTaskDeleted,
  onEditTask,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [view, setView] = useState<"month" | "week" | "day">("month")

  const getMonthData = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - startDate.getDay())
    const endDate = new Date(lastDay)
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

    const days = []
    const current = new Date(startDate)
    while (current <= endDate) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return days
  }

  const getWeekData = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(day.getDate() + i)
      days.push(day)
    }
    return days
  }

  const getTasksForDate = (date: Date) => {
    return tasks
      .filter((task) => {
        if (!task.due_date) return false
        const taskDate = new Date(task.due_date)
        return taskDate.toDateString() === date.toDateString()
      })
      .sort((a, b) => {
        if (!a.start_time && !b.start_time) return 0
        if (!a.start_time) return 1
        if (!b.start_time) return -1
        return a.start_time.localeCompare(b.start_time)
      })
  }

  const handlePrevious = () => {
    const newDate = new Date(currentDate)
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() - 1)
    }
    setCurrentDate(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(currentDate)
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  const handleAddTask = (date: Date) => {
    setSelectedDate(date)
    setShowTaskForm(true)
  }

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : []

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-3xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {currentDate.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
            })}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="shadow-md font-semibold bg-transparent text-xs sm:text-sm h-9 px-3"
          >
            오늘
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border-2 border-primary/20 rounded-lg overflow-hidden flex-1">
            <Button
              variant={view === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("month")}
              className="rounded-none font-semibold text-xs sm:text-sm h-9 flex-1"
            >
              월
            </Button>
            <Button
              variant={view === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("week")}
              className="rounded-none font-semibold text-xs sm:text-sm h-9 flex-1"
            >
              주
            </Button>
            <Button
              variant={view === "day" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("day")}
              className="rounded-none font-semibold text-xs sm:text-sm h-9 flex-1"
            >
              일
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevious} className="shadow-md bg-transparent h-9 w-9">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext} className="shadow-md bg-transparent h-9 w-9">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2 border-0 shadow-xl overflow-hidden">
          <CardContent className="p-0">
            {view === "month" && (
              <div className="p-2 sm:p-6">
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-4">
                  {["일", "월", "화", "수", "목", "금", "토"].map((day, idx) => (
                    <div
                      key={day}
                      className={`text-center text-xs sm:text-sm font-bold py-2 rounded-md ${
                        idx === 0
                          ? "text-destructive bg-destructive/10"
                          : idx === 6
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground"
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {getMonthData().map((date, index) => {
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                    const isToday = date.toDateString() === new Date().toDateString()
                    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
                    const dateTasks = getTasksForDate(date)

                    return (
                      <button
                        key={index}
                        onClick={() => handleDateClick(date)}
                        className={`
                          relative flex flex-col items-center justify-center
                          min-h-[50px] sm:min-h-[70px] p-1 sm:p-2
                          rounded-lg border-2 text-sm font-semibold
                          hover:bg-primary/10 hover:border-primary transition-all duration-200
                          active:scale-95
                          ${!isCurrentMonth ? "text-muted-foreground bg-muted/30 border-transparent" : "border-border bg-white"}
                          ${isToday ? "border-primary bg-primary/5 ring-2 ring-primary/30 font-black" : ""}
                          ${isSelected ? "bg-accent/20 border-accent shadow-lg" : ""}
                        `}
                      >
                        <span className={`${isToday ? "text-primary" : ""} text-sm sm:text-base font-bold`}>
                          {date.getDate()}
                        </span>
                        {dateTasks.length > 0 && (
                          <div className="flex items-center justify-center mt-1">
                            <div className="flex gap-0.5">
                              {dateTasks.slice(0, 3).map((_, i) => (
                                <div
                                  key={i}
                                  className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary to-accent"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {view === "week" && (
              <div className="p-3 sm:p-6">
                <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
                  <div className="grid grid-cols-7 gap-2 min-w-[600px] sm:min-w-0">
                    {getWeekData().map((date, index) => {
                      const isToday = date.toDateString() === new Date().toDateString()
                      const dateTasks = getTasksForDate(date)

                      return (
                        <div key={index} className="space-y-2">
                          <div className="text-center">
                            <div className="text-xs font-semibold text-muted-foreground mb-2">
                              {["일", "월", "화", "수", "목", "금", "토"][date.getDay()]}
                            </div>
                            <button
                              onClick={() => handleDateClick(date)}
                              className={`
                                w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base
                                hover:bg-accent transition-all duration-200 active:scale-95 shadow-md
                                ${isToday ? "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-xl" : "bg-card"}
                              `}
                            >
                              {date.getDate()}
                            </button>
                          </div>
                          <div className="space-y-2 min-h-[180px]">
                            {dateTasks.map((task) => (
                              <button
                                key={task.id}
                                onClick={() => {
                                  setSelectedDate(date)
                                  onEditTask(task)
                                }}
                                className="w-full p-2 text-left text-xs rounded-lg border-2 bg-card hover:bg-accent/20 hover:border-primary transition-all duration-200 active:scale-95 shadow-md"
                              >
                                <div className="font-bold truncate">{task.title}</div>
                                {(task.start_time || task.end_time) && (
                                  <div className="text-primary font-bold mt-1 text-xs">
                                    {task.start_time && task.end_time
                                      ? `${task.start_time} - ${task.end_time}`
                                      : task.start_time
                                        ? `${task.start_time}부터`
                                        : `${task.end_time}까지`}
                                  </div>
                                )}
                              </button>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full shadow-md hover:shadow-lg active:scale-95 transition-all bg-transparent text-xs h-8"
                              onClick={() => handleAddTask(date)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {view === "day" && (
              <div className="p-4 sm:p-6">
                <div className="text-center mb-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-4 sm:p-6">
                  <div className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {currentDate.toLocaleDateString("ko-KR", {
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-muted-foreground font-semibold mt-2 text-sm sm:text-lg">
                    {["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"][currentDate.getDay()]}
                  </div>
                </div>
                <TaskList
                  tasks={getTasksForDate(currentDate)}
                  onTaskDeleted={onTaskDeleted}
                  onEditTask={onEditTask}
                  workspaceId={workspaceId}
                />
                <Button
                  className="w-full mt-4 shadow-xl hover:shadow-2xl active:scale-95 transition-all h-12"
                  onClick={() => handleAddTask(currentDate)}
                >
                  <Plus className="w-5 h-5 mr-2" />할 일 추가
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedDate && view !== "day" && (
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-br from-primary/10 to-accent/10 p-4">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base sm:text-xl font-black truncate">
                  {selectedDate.toLocaleDateString("ko-KR", {
                    month: "long",
                    day: "numeric",
                  })}
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => handleAddTask(selectedDate)}
                  className="shadow-md text-xs flex-shrink-0"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  추가
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 p-3 sm:p-6">
              {selectedDateTasks.length === 0 ? (
                <p className="text-xs sm:text-sm text-muted-foreground text-center py-8 font-medium">
                  할 일이 없습니다
                </p>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {selectedDateTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => onEditTask(task)}
                      className="w-full p-3 text-left rounded-lg border-2 hover:bg-accent/20 hover:border-primary transition-all duration-200 active:scale-95 shadow-md"
                    >
                      <div className="font-bold mb-2 text-sm break-words">{task.title}</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {(task.start_time || task.end_time) && (
                          <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-md whitespace-nowrap">
                            {task.start_time && task.end_time
                              ? `${task.start_time} - ${task.end_time}`
                              : task.start_time
                                ? `${task.start_time}부터`
                                : `${task.end_time}까지`}
                          </span>
                        )}
                        <Badge
                          variant={task.status === "done" ? "secondary" : "outline"}
                          className="text-xs font-bold shadow-sm"
                        >
                          {task.status === "done" ? "완료" : task.status === "in_progress" ? "진행 중" : "할 일"}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {showTaskForm && (
        <TaskForm
          workspaceId={workspaceId}
          userId={userId}
          defaultDate={selectedDate?.toISOString().split("T")[0]}
          onClose={() => setShowTaskForm(false)}
          onTaskCreated={() => {
            setShowTaskForm(false)
            onTaskCreated()
          }}
        />
      )}
    </div>
  )
}
