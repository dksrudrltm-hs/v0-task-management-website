"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, Mail, CheckCircle2, RefreshCw, Check, X } from "lucide-react"

const GoogleLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

export function AuthForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nickname, setNickname] = useState("")
  const [nicknameError, setNicknameError] = useState("")
  const [nicknameValid, setNicknameValid] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [emailSent, setEmailSent] = useState(false)
  const [resendCount, setResendCount] = useState(0)

  const validateNickname = (value: string) => {
    setNickname(value)

    if (!value.trim()) {
      setNicknameError("")
      setNicknameValid(false)
      return
    }

    if (value.length < 2) {
      setNicknameError("닉네임은 최소 2자 이상이어야 합니다")
      setNicknameValid(false)
      return
    }

    if (value.length > 20) {
      setNicknameError("닉네임은 최대 20자까지 가능합니다")
      setNicknameValid(false)
      return
    }

    const validPattern = /^[가-힣a-zA-Z0-9\s]+$/
    if (!validPattern.test(value)) {
      setNicknameError("한글, 영문, 숫자만 사용 가능합니다")
      setNicknameValid(false)
      return
    }

    if (/\s{2,}/.test(value)) {
      setNicknameError("연속된 공백은 사용할 수 없습니다")
      setNicknameValid(false)
      return
    }

    setNicknameError("")
    setNicknameValid(true)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    if (!nicknameValid) {
      setError("올바른 닉네임을 입력해주세요")
      setLoading(false)
      return
    }

    console.log("[v0] Starting signup process for:", email, "nickname:", nickname)

    try {
      const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
        : `${window.location.origin}/auth/callback`

      console.log("[v0] Email redirect URL:", redirectUrl)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nickname: nickname.trim(),
            email_confirmed: false,
          },
        },
      })

      console.log("[v0] Signup response:", { data, error })

      if (error) {
        console.error("[v0] Signup error:", error)
        throw error
      }

      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        setError("이 이메일은 이미 등록되어 있습니다. 로그인을 시도해주세요.")
        console.log("[v0] User already exists")
        return
      }

      if (data?.user && !data.session) {
        console.log("[v0] Email verification required for:", data.user.email)
        setEmailSent(true)
        setMessage("인증 이메일이 발송되었습니다.")
      } else if (data?.session) {
        console.log("[v0] Auto sign-in (email confirmation disabled)")
        const { error: workspaceError } = await supabase.from("workspaces").insert({
          name: `${nickname.trim()}의 워크스페이스`,
          user_id: data.user.id,
          workspace_key: crypto.randomUUID(),
        })

        if (workspaceError) {
          console.error("[v0] Failed to create workspace:", workspaceError)
        }

        window.location.reload()
      }
    } catch (err: any) {
      console.error("[v0] Signup exception:", err)
      setError(err.message || "회원가입 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setResendLoading(true)
    setError("")
    setMessage("")

    console.log("[v0] Resending verification email to:", email)

    try {
      const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
        : `${window.location.origin}/auth/callback`

      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      })

      if (error) {
        console.error("[v0] Resend error:", error)
        throw error
      }

      setResendCount(resendCount + 1)
      setMessage(`인증 이메일이 다시 발송되었습니다. (${resendCount + 1}회)`)
      console.log("[v0] Email resent successfully")
    } catch (err: any) {
      console.error("[v0] Resend exception:", err)
      setError(err.message || "이메일 재발송 중 오류가 발생했습니다.")
    } finally {
      setResendLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    console.log("[v0] Starting sign in for:", email)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("[v0] Sign in error:", error)
        throw error
      }

      console.log("[v0] Sign in successful")
      window.location.reload()
    } catch (err: any) {
      console.error("[v0] Sign in exception:", err)
      if (err.message?.includes("Email not confirmed")) {
        setError("이메일이 인증되지 않았습니다. 이메일의 인증 링크를 클릭해주세요.")
      } else if (err.message?.includes("Invalid login credentials")) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.")
      } else {
        setError(err.message || "로그인 중 오류가 발생했습니다.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError("")
    setMessage("")

    console.log("[v0] Starting Google OAuth sign in")

    try {
      const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
        : `${window.location.origin}/auth/callback`

      console.log("[v0] OAuth redirect URL:", redirectUrl)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (error) {
        console.error("[v0] Google OAuth error:", error)
        throw error
      }

      console.log("[v0] Google OAuth initiated successfully")
    } catch (err: any) {
      console.error("[v0] Google OAuth exception:", err)
      setError(err.message || "Google 로그인 중 오류가 발생했습니다.")
      setGoogleLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 p-4">
        <Card className="w-full max-w-md shadow-2xl border-2 border-teal-100">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 rounded-full bg-primary/10 p-3">
              <Mail className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">이메일 인증이 필요합니다</CardTitle>
            <CardDescription>
              <span className="font-medium text-foreground">{email}</span> 주소로 인증 이메일을 보냈습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-800 dark:text-green-200">발송 완료</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-300">{message}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertDescription className="text-sm">
                <div className="space-y-2">
                  <p className="font-medium">다음 단계:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>이메일 받은편지함을 확인하세요</li>
                    <li>
                      <strong>"Confirm your mail"</strong> 버튼을 클릭하세요
                    </li>
                    <li>인증이 완료되면 자동으로 로그인됩니다</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>

            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-amber-800 dark:text-amber-200">이메일이 도착하지 않나요?</AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-300 text-xs space-y-2">
                <p>다음 사항을 확인해주세요:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>스팸 폴더</strong>를 확인하세요
                  </li>
                  <li>
                    <strong>프로모션/소셜 탭</strong>을 확인하세요 (Gmail)
                  </li>
                  <li>
                    이메일 주소 <strong>{email}</strong>가 정확한지 확인하세요
                  </li>
                  <li>1-2분 정도 기다려주세요 (발송 지연 가능)</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={handleResendEmail}
                disabled={resendLoading}
                className="w-full bg-transparent"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    이메일 재발송 중...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    인증 이메일 다시 보내기
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  setEmailSent(false)
                  setEmail("")
                  setPassword("")
                  setError("")
                  setMessage("")
                  setResendCount(0)
                }}
                className="w-full"
              >
                다른 이메일로 가입하기
              </Button>
            </div>

            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
              <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-2">문제 해결 가이드:</p>
                <div className="space-y-1">
                  <p>
                    <strong>Gmail 사용자:</strong> "소셜" 또는 "프로모션" 탭 확인
                  </p>
                  <p>
                    <strong>Naver/Daum:</strong> 스팸메일함 확인
                  </p>
                  <p>
                    <strong>회사 이메일:</strong> 보안 필터로 차단될 수 있음
                  </p>
                  <p className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                    <strong>권장:</strong> Gmail, Naver, Kakao 등 개인 이메일 사용
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 border-teal-200 bg-white">
        <CardHeader className="space-y-1 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold text-center">Task Manager</CardTitle>
          <CardDescription className="text-center text-white/90">
            계정에 로그인하거나 새로운 계정을 만드세요
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 bg-gray-50/30">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white">
              <TabsTrigger value="signin">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">이메일</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                    className="bg-white placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">비밀번호</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                    minLength={6}
                    className="bg-white placeholder:text-gray-400"
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {message && (
                  <Alert>
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading || googleLoading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      로그인 중...
                    </>
                  ) : (
                    "로그인"
                  )}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gray-50 px-2 text-muted-foreground">또는</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={loading || googleLoading}
                  className="w-full border-2 hover:bg-gray-50 transition-colors bg-transparent"
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Google 연결 중...
                    </>
                  ) : (
                    <>
                      <GoogleLogo className="mr-2 h-5 w-5" />
                      Google로 계속하기
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-nickname">
                    닉네임 <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-nickname"
                      type="text"
                      placeholder="홍길동 또는 User123"
                      value={nickname}
                      onChange={(e) => validateNickname(e.target.value)}
                      required
                      disabled={loading || googleLoading}
                      className={`bg-white placeholder:text-gray-400 ${
                        nickname
                          ? nicknameValid
                            ? "border-green-500 pr-10"
                            : nicknameError
                              ? "border-destructive pr-10"
                              : ""
                          : ""
                      }`}
                    />
                    {nickname && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {nicknameValid ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : nicknameError ? (
                          <X className="h-5 w-5 text-destructive" />
                        ) : null}
                      </div>
                    )}
                  </div>
                  {nicknameError ? (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {nicknameError}
                    </p>
                  ) : nicknameValid ? (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      사용 가능한 닉네임입니다
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">한글, 영문, 숫자 사용 가능 (2-20자)</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">이메일</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                    className="bg-white placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">비밀번호</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                    minLength={6}
                    className="bg-white placeholder:text-gray-400"
                  />
                  <p className="text-xs text-muted-foreground">비밀번호는 최소 6자 이상이어야 합니다</p>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {message && (
                  <Alert>
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading || !nicknameValid || googleLoading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      가입 처리 중...
                    </>
                  ) : (
                    "회원가입"
                  )}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gray-50 px-2 text-muted-foreground">또는</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={loading || googleLoading}
                  className="w-full border-2 hover:bg-gray-50 transition-colors bg-transparent"
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Google 연결 중...
                    </>
                  ) : (
                    <>
                      <GoogleLogo className="mr-2 h-5 w-5" />
                      Google로 계속하기
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
