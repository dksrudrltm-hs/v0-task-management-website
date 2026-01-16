/**
 * Utility functions for handling dates and times in Korean timezone (Asia/Seoul)
 */

/**
 * Get current date and time in Korean timezone
 */
export function getNowInKoreanTime(): Date {
  return new Date()
}

/**
 * Format date for display in Korean format
 */
export function formatKoreanDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  })
}

/**
 * Format datetime for display in Korean format
 */
export function formatKoreanDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  })
}

/**
 * Get ISO date string for current date in Korean timezone
 * Format: YYYY-MM-DD
 */
export function getTodayInKoreanTime(): string {
  const now = new Date()
  const koreanTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }))
  return koreanTime.toISOString().split("T")[0]
}

/**
 * Format time for display (HH:MM)
 */
export function formatTime(time: string): string {
  return time
}

/**
 * Check if a date is today in Korean timezone
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date
  const today = getTodayInKoreanTime()
  const dateStr = d.toISOString().split("T")[0]
  return dateStr === today
}
