"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  X,
  File,
  FileImage,
  FileText,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface FileUploadProps {
  taskId: string
  userId: string
  onUploadComplete: () => void
}

interface AttachmentListProps {
  taskId: string
  userId: string
  attachments: any[]
  onDelete: () => void
}

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function generateSafeStoragePath(userId: string, taskId: string, fileName: string): string {
  const timestamp = Date.now()
  // Extract file extension
  const lastDotIndex = fileName.lastIndexOf(".")
  const extension = lastDotIndex > 0 ? fileName.slice(lastDotIndex).toLowerCase() : ""
  // Generate a unique ID for the file (using timestamp + random string)
  const uniqueId = `${timestamp}_${Math.random().toString(36).substring(2, 10)}`
  // Create path with only ASCII characters
  return `${userId}/${taskId}/${uniqueId}${extension}`
}

export function FileUpload({ taskId, userId, onUploadComplete }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [currentFileName, setCurrentFileName] = useState<string | null>(null)
  const [storageNotConfigured, setStorageNotConfigured] = useState(false)

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const validateFile = (file: File): string | null => {
    if (!Object.keys(ALLOWED_TYPES).includes(file.type)) {
      return "허용되지 않는 파일 형식입니다. (jpg, png, gif, pdf, doc, docx만 가능)"
    }
    if (file.size > MAX_FILE_SIZE) {
      return "파일 크기는 10MB를 초과할 수 없습니다."
    }
    return null
  }

  const uploadFile = async (file: File) => {
    setError(null)
    setSuccess(null)
    setStorageNotConfigured(false)

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setCurrentFileName(file.name)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 60) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const filePath = generateSafeStoragePath(userId, taskId, file.name)

      console.log("[v0] Uploading file to path:", filePath)
      console.log("[v0] User ID:", userId)
      console.log("[v0] Task ID:", taskId)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("task-attachments")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

      clearInterval(progressInterval)

      if (uploadError) {
        console.error("[v0] Storage upload error:", uploadError.message)

        if (
          uploadError.message.includes("row-level security") ||
          uploadError.message.includes("Bucket not found") ||
          uploadError.message.includes("not found")
        ) {
          setStorageNotConfigured(true)
          throw new Error("스토리지 설정이 필요합니다. 관리자에게 문의하세요.")
        }
        throw new Error(`스토리지 업로드 실패: ${uploadError.message}`)
      }

      setUploadProgress(70)
      console.log("[v0] File uploaded to storage, saving metadata...")

      const { error: dbError } = await supabase.from("task_attachments").insert({
        task_id: taskId,
        user_id: userId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: filePath,
      })

      if (dbError) {
        console.error("[v0] Database insert error:", dbError.message)
        await supabase.storage.from("task-attachments").remove([filePath])

        if (dbError.message.includes("row-level security")) {
          setStorageNotConfigured(true)
          throw new Error("데이터베이스 설정이 필요합니다. 관리자에게 문의하세요.")
        }
        throw new Error(`메타데이터 저장 실패: ${dbError.message}`)
      }

      setUploadProgress(100)
      console.log("[v0] File upload complete!")
      setSuccess(`"${file.name}" 업로드 완료!`)

      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
        setCurrentFileName(null)
        onUploadComplete()
      }, 500)
    } catch (err: any) {
      console.error("[v0] File upload error:", err.message)
      setError(err.message || "파일 업로드 중 오류가 발생했습니다.")
      setUploading(false)
      setUploadProgress(0)
      setCurrentFileName(null)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        uploadFile(e.dataTransfer.files[0])
      }
    },
    [taskId, userId],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0])
    }
    e.target.value = ""
  }

  return (
    <div className="space-y-3">
      {storageNotConfigured && (
        <Alert className="border-amber-300 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 font-bold">스토리지 설정 필요</AlertTitle>
          <AlertDescription className="text-amber-700 text-sm mt-1">
            <p>파일 업로드를 위해 Supabase에서 다음 설정이 필요합니다:</p>
            <ol className="list-decimal ml-4 mt-2 space-y-1">
              <li>
                Supabase SQL Editor에서{" "}
                <code className="bg-amber-100 px-1 rounded">scripts/005_storage_bucket_setup.sql</code> 실행
              </li>
              <li>
                또는 Storage 탭에서 <code className="bg-amber-100 px-1 rounded">task-attachments</code> 버킷 생성 및
                정책 설정
              </li>
            </ol>
          </AlertDescription>
        </Alert>
      )}

      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          dragActive
            ? "border-teal-500 bg-teal-50 scale-[1.02]"
            : "border-gray-300 bg-gray-50 hover:border-teal-400 hover:bg-teal-50/50"
        } ${uploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id={`file-upload-${taskId}`}
          className="hidden"
          accept={Object.values(ALLOWED_TYPES).join(",")}
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <label htmlFor={`file-upload-${taskId}`} className="cursor-pointer block">
          <div
            className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors ${
              dragActive ? "bg-teal-200" : "bg-gray-200"
            }`}
          >
            <Upload className={`w-8 h-8 ${dragActive ? "text-teal-600" : "text-gray-500"}`} />
          </div>
          <p className="text-base font-semibold text-gray-700">
            {dragActive ? "여기에 파일을 놓으세요!" : "파일을 드래그하거나 클릭하여 업로드"}
          </p>
          <p className="text-sm text-gray-500 mt-2">JPG, PNG, GIF, PDF, DOC, DOCX (최대 10MB)</p>
        </label>
      </div>

      {uploading && (
        <Card className="border-2 border-teal-200 bg-teal-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-teal-900 truncate">{currentFileName || "파일"} 업로드 중...</p>
              </div>
              <span className="text-sm font-bold text-teal-600">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 font-medium">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export function AttachmentList({ taskId, userId, attachments, onDelete }: AttachmentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <FileImage className="w-6 h-6 text-blue-500" />
    if (fileType === "application/pdf") return <FileText className="w-6 h-6 text-red-500" />
    return <File className="w-6 h-6 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const handleDownload = async (attachment: any) => {
    setDownloadingId(attachment.id)
    try {
      console.log("[v0] Downloading file:", attachment.storage_path)
      const { data, error } = await supabase.storage.from("task-attachments").download(attachment.storage_path)

      if (error) {
        console.error("[v0] Download error:", error)
        throw error
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
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async (attachment: any) => {
    if (!confirm(`"${attachment.file_name}" 파일을 삭제하시겠습니까?`)) return

    setDeletingId(attachment.id)
    try {
      console.log("[v0] Deleting file:", attachment.storage_path)

      const { error: storageError } = await supabase.storage.from("task-attachments").remove([attachment.storage_path])

      if (storageError) {
        console.error("[v0] Storage delete error:", storageError)
      }

      const { error: dbError } = await supabase.from("task_attachments").delete().eq("id", attachment.id)

      if (dbError) {
        console.error("[v0] Database delete error:", dbError)
        throw dbError
      }

      console.log("[v0] File deleted successfully")
      onDelete()
    } catch (err) {
      console.error("[v0] Delete error:", err)
    } finally {
      setDeletingId(null)
    }
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
        <File className="w-10 h-10 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">첨부된 파일이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <File className="w-4 h-4" />
          첨부파일 목록
        </h4>
        <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full font-medium">
          {attachments.length}개 파일
        </span>
      </div>

      <div className="space-y-2">
        {attachments.map((attachment) => (
          <Card key={attachment.id} className="border-2 border-gray-200 hover:border-teal-300 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  {getFileIcon(attachment.file_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate" title={attachment.file_name}>
                    {attachment.file_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.file_size)} ·{" "}
                    {new Date(attachment.created_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-teal-600 hover:text-teal-700 hover:bg-teal-100"
                    onClick={() => handleDownload(attachment)}
                    disabled={downloadingId === attachment.id}
                    title="다운로드"
                  >
                    {downloadingId === attachment.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-100"
                    onClick={() => handleDelete(attachment)}
                    disabled={deletingId === attachment.id}
                    title="삭제"
                  >
                    {deletingId === attachment.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
