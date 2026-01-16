"use client"

import type React from "react"

import { useState } from "react"
import { supabase, type Task } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [taskDate, setTaskDate] = useState(task?.due_date || defaultDate || "")
  const [startTime, setStartTime] = useState(task?.start_time || "")
  const [endTime, setEndTime] = useState(task?.end_time || "")
  const [loading, setLoading] = useState(false)

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
      due_date: taskDate || null,
      start_time: startTime || null,
      end_time: endTime || null,
    }

    if (task) {
      await supabase.from("tasks").update(taskData).eq("id", task.id)
    } else {
      await supabase.from("tasks").insert([taskData])
    }

    setLoading(false)
    onTaskCreated()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white shadow-2xl border-2 border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{task ? "할 일 수정" : "새 할 일 추가"}</DialogTitle>
          <DialogDescription className="text-gray-600">할 일의 상세 정보를 입력하세요</DialogDescription>
        </DialogHeader>
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
              className="bg-white border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-gray-900 placeholder:text-gray-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-gray-700 font-semibold">
                상태
              </Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
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
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
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

          <div className="space-y-2">
            <Label htmlFor="task-date" className="text-gray-700 font-semibold">
              날짜
            </Label>
            <Input
              id="task-date"
              type="date"
              value={taskDate}
              onChange={(e) => setTaskDate(e.target.value)}
              className="bg-white border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time" className="text-gray-700 font-semibold">
                시작 시간
              </Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger
                  id="start-time"
                  className="bg-white border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-gray-900"
                >
                  <SelectValue placeholder="선택하세요" className="text-gray-400" />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-white border-2 border-gray-300">
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time" className="text-gray-700 font-semibold">
                종료 시간
              </Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger
                  id="end-time"
                  className="bg-white border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-gray-900"
                >
                  <SelectValue placeholder="선택하세요" className="text-gray-400" />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-white border-2 border-gray-300">
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold shadow-lg"
            >
              {loading ? "저장 중..." : task ? "수정" : "추가"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
