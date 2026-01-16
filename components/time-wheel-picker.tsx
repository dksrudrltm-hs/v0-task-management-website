"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown, Clock } from "lucide-react"

interface TimeWheelPickerProps {
  value: string // "HH:MM" format
  onChange: (time: string) => void
  label: string
  disabled?: boolean
}

export function TimeWheelPicker({ value, onChange, label, disabled }: TimeWheelPickerProps) {
  const [hour, setHour] = useState(value ? Number.parseInt(value.split(":")[0]) : 9)
  const [minute, setMinute] = useState(value ? Number.parseInt(value.split(":")[1]) : 0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)
  const [dragType, setDragType] = useState<"hour" | "minute" | null>(null)

  const hourRef = useRef<HTMLDivElement>(null)
  const minuteRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    onChange(timeString)
  }, [hour, minute])

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":").map(Number)
      setHour(h)
      setMinute(m)
    }
  }, [value])

  const handleHourIncrement = () => {
    setHour((prev) => (prev + 1) % 24)
  }

  const handleHourDecrement = () => {
    setHour((prev) => (prev - 1 + 24) % 24)
  }

  const handleMinuteIncrement = () => {
    setMinute((prev) => {
      const newMin = prev + 10
      if (newMin >= 60) {
        handleHourIncrement()
        return 0
      }
      return newMin
    })
  }

  const handleMinuteDecrement = () => {
    setMinute((prev) => {
      const newMin = prev - 10
      if (newMin < 0) {
        handleHourDecrement()
        return 50
      }
      return newMin
    })
  }

  const handleWheel = (e: React.WheelEvent, type: "hour" | "minute") => {
    e.preventDefault()
    if (disabled) return

    if (type === "hour") {
      if (e.deltaY > 0) {
        handleHourDecrement()
      } else {
        handleHourIncrement()
      }
    } else {
      if (e.deltaY > 0) {
        handleMinuteDecrement()
      } else {
        handleMinuteIncrement()
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent, type: "hour" | "minute") => {
    if (disabled) return
    setIsDragging(true)
    setDragStart(e.clientY)
    setDragType(type)
  }

  const handleTouchStart = (e: React.TouchEvent, type: "hour" | "minute") => {
    if (disabled) return
    setIsDragging(true)
    setDragStart(e.touches[0].clientY)
    setDragType(type)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragType) return

      const diff = dragStart - e.clientY
      const threshold = 20

      if (Math.abs(diff) > threshold) {
        if (dragType === "hour") {
          if (diff > 0) {
            handleHourIncrement()
          } else {
            handleHourDecrement()
          }
        } else {
          if (diff > 0) {
            handleMinuteIncrement()
          } else {
            handleMinuteDecrement()
          }
        }
        setDragStart(e.clientY)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !dragType) return

      const diff = dragStart - e.touches[0].clientY
      const threshold = 20

      if (Math.abs(diff) > threshold) {
        if (dragType === "hour") {
          if (diff > 0) {
            handleHourIncrement()
          } else {
            handleHourDecrement()
          }
        } else {
          if (diff > 0) {
            handleMinuteIncrement()
          } else {
            handleMinuteDecrement()
          }
        }
        setDragStart(e.touches[0].clientY)
      }
    }

    const handleEnd = () => {
      setIsDragging(false)
      setDragType(null)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleEnd)
      document.addEventListener("touchmove", handleTouchMove)
      document.addEventListener("touchend", handleEnd)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleEnd)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleEnd)
    }
  }, [isDragging, dragStart, dragType])

  const getPreviousHour = () => (hour - 1 + 24) % 24
  const getNextHour = () => (hour + 1) % 24
  const getPreviousMinute = () => (minute - 10 < 0 ? 50 : minute - 10)
  const getNextMinute = () => (minute + 10 >= 60 ? 0 : minute + 10)

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <Clock className="w-4 h-4 text-teal-600" />
        {label}
      </label>
      <div
        className={`
        relative flex items-center justify-center gap-2 p-4 rounded-xl
        bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
      >
        {/* Hour Wheel */}
        <div className="flex flex-col items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleHourIncrement}
            disabled={disabled}
            className="h-8 w-12 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg mb-1"
          >
            <ChevronUp className="w-5 h-5" />
          </Button>

          <div
            ref={hourRef}
            onWheel={(e) => handleWheel(e, "hour")}
            onMouseDown={(e) => handleMouseDown(e, "hour")}
            onTouchStart={(e) => handleTouchStart(e, "hour")}
            className={`
              relative h-32 w-20 overflow-hidden rounded-xl border-2 border-gray-300
              bg-white shadow-inner cursor-grab active:cursor-grabbing
              ${disabled ? "cursor-not-allowed" : ""}
            `}
            style={{ userSelect: "none" }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />

              <div className="flex flex-col items-center transition-all duration-200">
                <div className="text-2xl font-light text-gray-300 py-2">
                  {String(getPreviousHour()).padStart(2, "0")}
                </div>
                <div className="text-5xl font-black text-teal-600 py-2 scale-110">{String(hour).padStart(2, "0")}</div>
                <div className="text-2xl font-light text-gray-300 py-2">{String(getNextHour()).padStart(2, "0")}</div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-16 border-y-2 border-teal-300 bg-teal-50/30" />
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleHourDecrement}
            disabled={disabled}
            className="h-8 w-12 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg mt-1"
          >
            <ChevronDown className="w-5 h-5" />
          </Button>

          <span className="text-xs font-semibold text-gray-500 mt-1">시간</span>
        </div>

        {/* Separator */}
        <div className="text-4xl font-black text-gray-400 pb-6">:</div>

        {/* Minute Wheel */}
        <div className="flex flex-col items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleMinuteIncrement}
            disabled={disabled}
            className="h-8 w-12 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg mb-1"
          >
            <ChevronUp className="w-5 h-5" />
          </Button>

          <div
            ref={minuteRef}
            onWheel={(e) => handleWheel(e, "minute")}
            onMouseDown={(e) => handleMouseDown(e, "minute")}
            onTouchStart={(e) => handleTouchStart(e, "minute")}
            className={`
              relative h-32 w-20 overflow-hidden rounded-xl border-2 border-gray-300
              bg-white shadow-inner cursor-grab active:cursor-grabbing
              ${disabled ? "cursor-not-allowed" : ""}
            `}
            style={{ userSelect: "none" }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />

              <div className="flex flex-col items-center transition-all duration-200">
                <div className="text-2xl font-light text-gray-300 py-2">
                  {String(getPreviousMinute()).padStart(2, "0")}
                </div>
                <div className="text-5xl font-black text-rose-600 py-2 scale-110">
                  {String(minute).padStart(2, "0")}
                </div>
                <div className="text-2xl font-light text-gray-300 py-2">{String(getNextMinute()).padStart(2, "0")}</div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-16 border-y-2 border-rose-300 bg-rose-50/30" />
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleMinuteDecrement}
            disabled={disabled}
            className="h-8 w-12 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg mt-1"
          >
            <ChevronDown className="w-5 h-5" />
          </Button>

          <span className="text-xs font-semibold text-gray-500 mt-1">분</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center">
        {disabled ? "수정 모드에서만 시간을 변경할 수 있습니다" : "화살표 버튼, 휠 스크롤, 드래그로 시간을 선택하세요"}
      </p>
    </div>
  )
}
