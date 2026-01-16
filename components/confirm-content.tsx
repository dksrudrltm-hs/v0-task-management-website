"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, AlertCircle, LinkIcon, Mail } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function ConfirmContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    const checkAuthAndProcess = async () => {
      const success = searchParams.get("success")
      const error = searchParams.get("error")
      const message = searchParams.get("message")
      const userEmail = searchParams.get("email")

      console.log("[v0] Confirm page params:", { success, error, message, email: userEmail })

      if (userEmail) {
        setEmail(decodeURIComponent(userEmail))
      }

      if (typeof window !== "undefined" && window.location.hash) {
        console.log("[v0] Hash fragment detected, processing...")
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get("access_token")
        const refreshToken = hashParams.get("refresh_token")

        if (accessToken) {
          console.log("[v0] Access token found in hash, setting session...")
          try {
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || "",
            })

            if (sessionError) {
              console.error("[v0] Session set error:", sessionError)
              setStatus("error")
              setErrorMessage(sessionError.message || "세션 설정에 실패했습니다")
              return
            }

            if (data?.session) {
              console.log("[v0] Session set successfully, redirecting...")
              // Clear hash and redirect to home
              window.history.replaceState(null, "", window.location.pathname)
              router.push("/")
              return
            }
          } catch (err: any) {
            console.error("[v0] Hash processing error:", err)
            setStatus("error")
            setErrorMessage(err.message || "인증 처리 중 오류가 발생했습니다")
            return
          }
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        console.log("[v0] User already authenticated, redirecting to home")
        // User is authenticated, check/create workspace and redirect
        const { data: workspace } = await supabase
          .from("workspaces")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle()

        if (!workspace) {
          const nickname =
            session.user.user_metadata?.nickname ||
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "사용자"

          await supabase.from("workspaces").insert({
            name: `${nickname}의 워크스페이스`,
            user_id: session.user.id,
            workspace_key: crypto.randomUUID(),
          })
        }

        setStatus("success")
        setEmail(session.user.email || "")
        // Auto redirect after short delay to show success message
        setTimeout(() => {
          router.push("/")
        }, 1500)
        return
      }

      // Handle explicit success/error params
      if (success === "true") {
        setStatus("success")
        setTimeout(() => {
          router.push("/")
        }, 2000)
      } else if (error === "true") {
        setStatus("error")
        setErrorMessage(message ? decodeURIComponent(message) : "인증에 실패했습니다")
      } else {
        // No params and no session - wait a bit then check session again
        setTimeout(async () => {
          const {
            data: { session: retrySession },
          } = await supabase.auth.getSession()
          if (retrySession?.user) {
            console.log("[v0] Session found on retry, redirecting")
            router.push("/")
          } else {
            setStatus("error")
            setErrorMessage("인증 링크가 올바르지 않습니다. 이메일의 링크를 다시 확인해주세요.")
          }
        }, 3000)
      }
    }

    checkAuthAndProcess()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[v0] Auth state changed:", event, session?.user?.email)
      if (event === "SIGNED_IN" && session?.user) {
        setStatus("success")
        setEmail(session.user.email || "")
        setTimeout(() => {
          router.push("/")
        }, 1500)
      }
    })

    return () => subscription.unsubscribe()
  }, [searchParams, router])

  const handleContinue = () => {
    router.push("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-2">
        <CardHeader className="space-y-1 text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto mb-4">
                <Loader2 className="h-16 w-16 animate-spin text-teal-600" />
              </div>
              <CardTitle className="text-2xl font-bold">인증 처리 중</CardTitle>
              <CardDescription>잠시만 기다려주세요. 계정을 확인하고 있습니다...</CardDescription>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 rounded-full bg-green-100 p-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-800">인증 완료!</CardTitle>
              <CardDescription className="text-green-700">
                {email && (
                  <>
                    <span className="font-medium">{email}</span> 계정이 확인되었습니다.
                    <br />
                  </>
                )}
                잠시 후 자동으로 이동합니다...
              </CardDescription>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 rounded-full bg-red-100 p-4">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-red-800">인증 실패</CardTitle>
              <CardDescription className="text-red-700">이메일 인증 과정에서 문제가 발생했습니다.</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "error" && errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
            </Alert>
          )}

          {status === "success" && (
            <div className="space-y-3">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-sm text-green-700">
                  워크스페이스가 준비되었습니다. 바로 작업을 시작할 수 있습니다.
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
                size="lg"
              >
                Task Manager 시작하기
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-3">
              <Alert className="border-amber-200 bg-amber-50">
                <Mail className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">이메일 링크 확인 방법</AlertTitle>
                <AlertDescription className="text-sm text-amber-700 space-y-2">
                  <p className="font-medium">이메일에서 찾아야 할 것:</p>
                  <div className="space-y-1 text-xs">
                    <p>
                      1. <strong>"Confirm your mail"</strong> 또는 <strong>"이메일 인증"</strong> 버튼
                    </p>
                    <p>
                      2. 버튼이 <strong className="text-blue-600 underline">파란색 링크</strong>로 표시되어야 함
                    </p>
                    <p>3. 클릭하면 이 웹사이트로 리디렉션되어야 함</p>
                  </div>
                </AlertDescription>
              </Alert>

              <Alert className="border-blue-200 bg-blue-50">
                <LinkIcon className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">링크가 작동하지 않나요?</AlertTitle>
                <AlertDescription className="text-sm text-blue-700">
                  <p className="font-medium mb-2">다음을 시도해보세요:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>
                      <strong>링크를 길게 누르기:</strong> 새 탭에서 열기 선택
                    </li>
                    <li>
                      <strong>링크 복사하기:</strong> 브라우저 주소창에 직접 붙여넣기
                    </li>
                    <li>
                      <strong>다른 브라우저 시도:</strong> Chrome, Safari, Edge 등
                    </li>
                    <li>
                      <strong>이메일 클라이언트 변경:</strong> 웹 버전으로 이메일 확인
                    </li>
                    <li>
                      <strong>스팸 폴더 확인:</strong> 올바른 이메일이 맞는지 확인
                    </li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Alert className="border-purple-200 bg-purple-50">
                <AlertCircle className="h-4 w-4 text-purple-600" />
                <AlertTitle className="text-purple-800">그래도 안 되면? (Supabase 설정 문제)</AlertTitle>
                <AlertDescription className="text-xs text-purple-700 space-y-2">
                  <p>현재 이메일 발송에 문제가 있을 수 있습니다:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Supabase 이메일 발송 제한 (Bounce Back)</li>
                    <li>개발 환경에서의 이메일 설정 미완료</li>
                    <li>커스텀 SMTP 설정 필요</li>
                  </ul>
                  <p className="mt-2 pt-2 border-t border-purple-200 font-medium">임시 해결 방법:</p>
                  <ul className="list-decimal list-inside space-y-1">
                    <li>로그인 페이지로 돌아가기</li>
                    <li>다른 이메일 주소로 다시 시도</li>
                    <li>Gmail, Naver, Kakao 등 주요 이메일 사용 권장</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
                size="lg"
              >
                로그인 페이지로 이동
              </Button>
            </div>
          )}

          {status === "loading" && (
            <Alert className="border-teal-200 bg-teal-50">
              <AlertDescription className="text-sm text-center text-teal-700">
                이 과정은 몇 초 정도 걸릴 수 있습니다. 페이지를 닫지 마세요.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
