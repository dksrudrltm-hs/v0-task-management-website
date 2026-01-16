import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const supabaseUrl = "https://zglkqcddysmoxttykkef.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbGtxY2RkeXNtb3h0dHlra2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MTMxNDgsImV4cCI6MjA4Mzk4OTE0OH0.zQHOPiid2hPO_7_BJEIEQyn0V3jVXf7aAXwagoT9dP0"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  console.log("[v0] Auth callback received:", {
    token_hash: token_hash ? `${token_hash.substring(0, 10)}...` : null,
    type,
    code: code ? `${code.substring(0, 10)}...` : null,
    origin,
  })

  const cookieStore = cookies()
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          console.error("[v0] Cookie set error:", error)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          console.error("[v0] Cookie remove error:", error)
        }
      },
    },
  })

  if (code) {
    try {
      console.log("[v0] Processing OAuth callback")

      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("[v0] OAuth session exchange error:", error)
        return NextResponse.redirect(
          `${origin}/auth/confirm?error=true&message=${encodeURIComponent(
            error.message || "Google 로그인에 실패했습니다",
          )}`,
        )
      }

      if (!data?.user) {
        console.error("[v0] No user data after OAuth")
        return NextResponse.redirect(
          `${origin}/auth/confirm?error=true&message=${encodeURIComponent("사용자 정보를 가져올 수 없습니다")}`,
        )
      }

      console.log("[v0] OAuth successful for user:", data.user.id)

      // Check if user has a workspace
      const { data: workspace, error: workspaceQueryError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("user_id", data.user.id)
        .maybeSingle()

      console.log("[v0] Workspace check:", {
        exists: !!workspace,
        error: workspaceQueryError?.message,
      })

      if (!workspace) {
        const fullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name
        const email = data.user.email || "사용자"
        const nickname = fullName || email.split("@")[0]

        console.log("[v0] Creating workspace for OAuth user with nickname:", nickname)

        const { error: workspaceError } = await supabase.from("workspaces").insert({
          name: `${nickname}의 워크스페이스`,
          user_id: data.user.id,
          workspace_key: crypto.randomUUID(),
        })

        if (workspaceError) {
          console.error("[v0] Failed to create workspace:", workspaceError)
        } else {
          console.log("[v0] Workspace created successfully")
        }
      }

      console.log("[v0] Redirecting to app with session")
      return NextResponse.redirect(`${origin}/`)
    } catch (err: any) {
      console.error("[v0] OAuth callback exception:", err)
      return NextResponse.redirect(
        `${origin}/auth/confirm?error=true&message=${encodeURIComponent(
          err.message || "Google 로그인 중 오류가 발생했습니다",
        )}`,
      )
    }
  }

  if (token_hash && type) {
    try {
      console.log("[v0] Processing email verification")

      const { data, error } = await supabase.auth.verifyOtp({
        type: type as any,
        token_hash,
      })

      console.log("[v0] OTP verification result:", {
        success: !!data?.user,
        userId: data?.user?.id,
        hasSession: !!data?.session,
        error: error?.message,
      })

      if (error) {
        console.error("[v0] Verification error:", error)
        return NextResponse.redirect(
          `${origin}/auth/confirm?error=true&message=${encodeURIComponent(
            error.message || "이메일 인증에 실패했습니다",
          )}`,
        )
      }

      if (!data?.user || !data?.session) {
        console.error("[v0] No user or session data after verification")
        return NextResponse.redirect(
          `${origin}/auth/confirm?error=true&message=${encodeURIComponent("인증은 완료되었으나 세션 생성에 실패했습니다")}`,
        )
      }

      // Check if user has a workspace
      const { data: workspace, error: workspaceQueryError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("user_id", data.user.id)
        .maybeSingle()

      console.log("[v0] Workspace check:", {
        exists: !!workspace,
        error: workspaceQueryError?.message,
      })

      if (!workspace) {
        const nickname = data.user.user_metadata?.nickname || "사용자"
        console.log("[v0] Creating workspace with nickname:", nickname)

        const { error: workspaceError } = await supabase.from("workspaces").insert({
          name: `${nickname}의 워크스페이스`,
          user_id: data.user.id,
          workspace_key: crypto.randomUUID(),
        })

        if (workspaceError) {
          console.error("[v0] Failed to create workspace:", workspaceError)
        } else {
          console.log("[v0] Workspace created successfully")
        }
      }

      console.log("[v0] Email verification successful, redirecting to app")
      return NextResponse.redirect(`${origin}/`)
    } catch (err: any) {
      console.error("[v0] Callback exception:", err)
      return NextResponse.redirect(
        `${origin}/auth/confirm?error=true&message=${encodeURIComponent(
          err.message || "알 수 없는 오류가 발생했습니다",
        )}`,
      )
    }
  }

  console.error("[v0] Missing required parameters:", { token_hash: !!token_hash, type, code: !!code })
  return NextResponse.redirect(
    `${origin}/auth/confirm?error=true&message=${encodeURIComponent(
      "인증 링크가 올바르지 않습니다. 이메일의 링크를 다시 확인해주세요.",
    )}`,
  )
}
