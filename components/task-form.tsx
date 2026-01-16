"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase, type Task } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUpload, AttachmentList } from "@/components/file-upload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Paperclip, Info, Clock } from "lucide-react"
import { TimeWheelPicker } from "@/components/time-wheel-picker"

interface TaskFormProps {
  workspaceId: string
  userId: string
  task?: Task
  onClose: () => void
  onTaskCreated: () => void
  defaultDate?: string
}

export function TaskForm({ workspaceId, userId, task, onClose, onTaskCreated, defaultDate }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || "")
  const [description, setDescription] = useState(task?.description || "")
  const [status, setStatus] = useState<"backlog" | "todo" | "in_progress" | "done">(task?.status || "todo")
  const [priority, setPriority] = useState<"low" | "medium" | "high">(task?.priority || "medium")
  const [startDate, setStartDate] = useState(task?.start_date || task?.due_date || defaultDate || "")
  const [endDate, setEndDate] = useState(task?.end_date || "")
  const [showEndDate, setShowEndDate] = useState(!!task?.end_date)
  const [startTime, setStartTime] = useState(task?.start_time || "")
  const [endTime, setEndTime] = useState(task?.end_time || "")
  const [loading, setLoading] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("details")
  const [currentTask, setCurrentTask] = useState<Task | undefined>(task)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [showAttachmentHint, setShowAttachmentHint] = useState(!task)
  const [isDateRangeHighlighted, setIsDateRangeHighlighted] = useState(false)

  useEffect(() => {
    if (currentTask?.id) {
      loadAttachments()
    }
  }, [currentTask?.id])

  const loadAttachments = async () => {
    if (!currentTask?.id) return
    const { data, error } = await supabase
      .from("task_attachments")
      .select("*")
      .eq("task_id", currentTask.id)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setAttachments(data)
    }
  }

  const generateTimeOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        const timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
        options.push(timeString)
      }
    }
    return options
  }

  const timeOptions = generateTimeOptions()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const taskData = {
      workspace_id: workspaceId,
      user_id: userId,
      title,
      description: description || null,
      status,
      priority,
      due_date: startDate || null,
      start_date: startDate || null,
      end_date: showEndDate && endDate ? endDate : null,
      start_time: startTime || null,
      end_time: endTime || null,
    }

    try {
      if (currentTask) {
        // Update existing task
        await supabase.from("tasks").update(taskData).eq("id", currentTask.id)
        setLoading(false)
        onTaskCreated()
      } else {
        // Create new task and get the ID for attachments
        const { data: newTask, error } = await supabase.from("tasks").insert([taskData]).select().single()

        if (error) throw error

        setCurrentTask(newTask)
        setShowAttachmentHint(false)
        setLoading(false)

        // Show success message and switch to attachments tab if user wants to add files
        if (pendingFiles.length > 0) {
          setActiveTab("attachments")
        } else {
          // Ask user if they want to add attachments or finish
          setActiveTab("attachments")
        }
      }
    } catch (error: any) {
      console.error("[v0] Task save error:", error)
      setLoading(false)
    }
  }

  const handleFinish = () => {
    onTaskCreated()
  }

  const isTaskCreated = !!currentTask?.id

  const calculateDuration = () => {
    if (!startTime || !endTime) return null
    const [startHour, startMin] = startTime.split(":").map(Number)
    const [endHour, endMin] = endTime.split(":").map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    const diffMinutes = endMinutes - startMinutes

    if (diffMinutes <= 0) return null

    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60

    if (hours === 0) return `${minutes}분`
    if (minutes === 0) return `${hours}시간`
    return `${hours}시간 ${minutes}분`
  }

  const timeValidation = () => {
    if (!startTime || !endTime) return null
    const [startHour, startMin] = startTime.split(":").map(Number)
    const [endHour, endMin] = endTime.split(":").map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    if (endMinutes <= startMinutes) {
      return "종료 시간은 시작 시간보다 늦어야 합니다"
    }
    return null
  }

  const calculateDateDuration = () => {
    if (!startDate) return null
    if (!showEndDate || !endDate) return null

    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return null
    if (diffDays === 1) return "1일"
    return `${diffDays}일`
  }

  const duration = calculateDuration()
  const dateDuration = calculateDateDuration()
  const validationError = timeValidation()

  useEffect(() => {
    if (startDate && showEndDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      setIsDateRangeHighlighted(end > start)
    } else {
      setIsDateRangeHighlighted(false)
    }
  }, [startDate, endDate, showEndDate])

  const isMultiDayTask = () => {
    if (!showEndDate || !startDate || !endDate) return false
    return startDate !== endDate
  }

  const showTimeInputs = startDate // Show time inputs whenever we have a date

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl border-2 border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            {task ? "할 일 수정" : currentTask ? "할 일 생성됨 - 첨부파일 추가" : "새 할 일 추가"}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {task
              ? "할 일의 상세 정보를 수정하세요"
              : currentTask
                ? "첨부파일을 추가하거나 완료하세요"
                : "할 일의 상세 정보를 입력하세요"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">상세 정보</TabsTrigger>
            <TabsTrigger value="attachments">
              <Paperclip className="w-4 h-4 mr-1" />
              첨부파일 {attachments.length > 0 && `(${attachments.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-700 font-semibold">
                  제목
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="할 일 제목"
                  required
                  disabled={isTaskCreated && !task}
                  className="bg-white border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-700 font-semibold">
                  설명
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="상세 설명 (선택사항)"
                  rows={3}
                  disabled={isTaskCreated && !task}
                  className="bg-white border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-gray-900 placeholder:text-gray-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-gray-700 font-semibold">
                    상태
                  </Label>
                  <Select
                    value={status}
                    onValueChange={(value: any) => setStatus(value)}
                    disabled={isTaskCreated && !task}
                  >
                    <SelectTrigger
                      id="status"
                      className="bg-white border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-gray-900"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-gray-300">
                      <SelectItem value="backlog">백로그</SelectItem>
                      <SelectItem value="todo">할 일</SelectItem>
                      <SelectItem value="in_progress">진행 중</SelectItem>
                      <SelectItem value="done">완료</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-gray-700 font-semibold">
                    우선순위
                  </Label>
                  <Select
                    value={priority}
                    onValueChange={(value: any) => setPriority(value)}
                    disabled={isTaskCreated && !task}
                  >
                    <SelectTrigger
                      id="priority"
                      className="bg-white border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-gray-900"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-gray-300">
                      <SelectItem value="low">낮음</SelectItem>
                      <SelectItem value="medium">보통</SelectItem>
                      <SelectItem value="high">높음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date" className="text-gray-700 font-semibold flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${isDateRangeHighlighted ? "bg-purple-500" : "bg-teal-500"}`}
                    />
                    시작 날짜
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      if (showEndDate && endDate && e.target.value > endDate) {
                        setEndDate(e.target.value)
                      }
                    }}
                    disabled={isTaskCreated && !task}
                    className="bg-white border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-gray-900 text-base h-12"
                  />
                </div>

                {showEndDate && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="end-date" className="text-gray-700 font-semibold flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-pink-500" />
                        종료 날짜
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowEndDate(false)
                          setEndDate("")
                        }}
                        className="text-xs text-gray-500 hover:text-rose-600 hover:bg-rose-50"
                      >
                        제거
                      </Button>
                    </div>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      disabled={isTaskCreated && !task}
                      className="bg-white border-2 border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 text-gray-900 text-base h-12"
                    />
                  </div>
                )}

                {!showEndDate && startDate && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowEndDate(true)
                      if (!endDate) {
                        setEndDate(startDate)
                      }
                    }}
                    className="w-full border-2 border-dashed border-gray-300 hover:border-purple-500 text-gray-600 hover:text-purple-600 hover:bg-purple-50 h-10 transition-all"
                  >
                    + 종료 날짜 추가 (여러 날 일정)
                  </Button>
                )}

                {dateDuration && isDateRangeHighlighted && (
                  <div className="p-4 rounded-xl bg-white border-2 border-purple-300 shadow-inner animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <span className="text-purple-600">📅</span>
                        일정 기간
                      </span>
                      <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-black shadow-sm">
                        {dateDuration}
                      </span>
                    </div>

                    {/* Visual date range bar */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex-1 text-center p-2 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="text-xs text-gray-500 mb-1">시작</div>
                        <div className="font-bold text-purple-600">
                          {new Date(startDate).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="h-1 w-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full" />
                      </div>
                      <div className="flex-1 text-center p-2 bg-pink-50 rounded-lg border border-pink-200">
                        <div className="text-xs text-gray-500 mb-1">종료</div>
                        <div className="font-bold text-pink-600">
                          {new Date(endDate).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {showTimeInputs && (
                <>
                  {isMultiDayTask() && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-sm text-blue-800">
                        여러 날에 걸친 일정입니다. 아래 시간은 각 날의 기본 시작/종료 시간으로 설정됩니다.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TimeWheelPicker
                      value={startTime}
                      onChange={setStartTime}
                      label={isMultiDayTask() ? "일일 시작 시간 (선택)" : "시작 시간"}
                      disabled={isTaskCreated && !task}
                    />

                    <TimeWheelPicker
                      value={endTime}
                      onChange={setEndTime}
                      label={isMultiDayTask() ? "일일 종료 시간 (선택)" : "종료 시간"}
                      disabled={isTaskCreated && !task}
                    />
                  </div>

                  {(startTime || endTime) && (
                    <div
                      className={`
                        p-4 rounded-xl border-2 transition-all duration-200
                        ${
                          validationError
                            ? "bg-red-50 border-red-300"
                            : "bg-gradient-to-br from-teal-50 to-blue-50 border-teal-300"
                        }
                      `}
                    >
                      {validationError ? (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-red-600 font-bold">!</span>
                          </div>
                          <div>
                            <p className="font-bold text-red-700 text-sm">{validationError}</p>
                            <p className="text-red-600 text-xs mt-1">시간을 다시 설정해주세요</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="w-5 h-5 text-teal-600" />
                              <span className="font-bold text-gray-700 text-sm">
                                {isMultiDayTask() ? "일일 예정 시간" : "예정 시간"}
                              </span>
                            </div>
                            {duration && (
                              <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold">
                                {duration}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-center gap-2 py-2">
                            {startTime && (
                              <div className="flex-1 text-center">
                                <div className="text-xs text-gray-500 font-medium mb-1">시작</div>
                                <div className="text-2xl font-black text-teal-600">{startTime}</div>
                              </div>
                            )}
                            {startTime && endTime && <div className="text-gray-400 font-bold text-xl">→</div>}
                            {endTime && (
                              <div className="flex-1 text-center">
                                <div className="text-xs text-gray-500 font-medium mb-1">종료</div>
                                <div className="text-2xl font-black text-rose-600">{endTime}</div>
                              </div>
                            )}
                          </div>
                          {isMultiDayTask() && (
                            <div className="text-xs text-center text-gray-600 mt-2 p-2 bg-white rounded-lg">
                              {dateDuration} 동안 매일 이 시간에 진행됩니다
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {!isTaskCreated && (
                <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 h-12 text-base border-2 hover:bg-gray-100 bg-transparent"
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !title.trim()}
                    className="flex-1 h-12 text-base bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "저장 중..." : task ? "수정하기" : "저장하기"}
                  </Button>
                </div>
              )}

              {task && (
                <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 h-12 text-base border-2 hover:bg-gray-100 bg-transparent"
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !title.trim()}
                    className="flex-1 h-12 text-base bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold shadow-lg"
                  >
                    {loading ? "업데이트 중..." : "업데이트"}
                  </Button>
                </div>
              )}
            </form>
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4">
            {isTaskCreated ? (
              <>
                {!task && currentTask && (
                  <Alert className="bg-green-50 border-green-200 mb-4">
                    <Info className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      할 일이 성공적으로 생성되었습니다! 이제 파일을 첨부할 수 있습니다.
                    </AlertDescription>
                  </Alert>
                )}
                <FileUpload taskId={currentTask!.id} userId={userId} onUploadComplete={loadAttachments} />
                <AttachmentList
                  taskId={currentTask!.id}
                  userId={userId}
                  attachments={attachments}
                  onDelete={loadAttachments}
                />

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("details")}
                    className="flex-1 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    상세 정보로 돌아가기
                  </Button>
                  <Button
                    type="button"
                    onClick={handleFinish}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold shadow-lg"
                  >
                    {attachments.length > 0 ? `완료 (${attachments.length}개 첨부됨)` : "완료"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Paperclip className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">먼저 할 일을 저장해주세요</p>
                <p className="text-sm mt-1">할 일을 저장한 후 파일을 첨부할 수 있습니다.</p>
                <Button
                  type="button"
                  onClick={() => setActiveTab("details")}
                  className="mt-4 bg-teal-500 hover:bg-teal-600 text-white"
                >
                  상세 정보 입력하기
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
