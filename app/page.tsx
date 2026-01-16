"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AuthForm } from "@/components/auth-form"
import { TaskDashboard } from "@/components/task-dashboard"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [workspaceLoading, setWorkspaceLoading] = useState(false)
  const workspaceFetchedRef = useRef(false)
  const currentUserIdRef = useRef<string | null>(null)

  const fetchOrCreateWorkspace = useCallback(
    async (userId: string, userMetadata: any) => {
      if (workspaceFetchedRef.current && currentUserIdRef.current === userId) {
        return workspaceId
      }

      currentUserIdRef.current = userId
      setWorkspaceLoading(true)

      try {
        console.log("[v0] Fetching workspace for user:", userId)

        const { data: workspace, error: fetchError } = await supabase
          .from("workspaces")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle()

        if (fetchError) {
          console.error("[v0] Error fetching workspace:", fetchError)
        }

        if (workspace) {
          console.log("[v0] Found existing workspace:", workspace.id)
          setWorkspaceId(workspace.id)
          workspaceFetchedRef.current = true
          return workspace.id
        } else {
          console.log("[v0] Creating new workspace for user")
          const nickname =
            userMetadata?.nickname || userMetadata?.full_name || userMetadata?.email?.split("@")[0] || "사용자"

          const { data: newWorkspace, error: createError } = await supabase
            .from("workspaces")
            .insert({
              name: `${nickname}의 워크스페이스`,
              user_id: userId,
              workspace_key: crypto.randomUUID(),
            })
            .select("id")
            .single()

          if (createError) {
            console.error("[v0] Error creating workspace:", createError)
            return null
          }

          if (newWorkspace) {
            console.log("[v0] Created new workspace:", newWorkspace.id)
            setWorkspaceId(newWorkspace.id)
            workspaceFetchedRef.current = true
            return newWorkspace.id
          }
        }
      } catch (err) {
        console.error("[v0] Workspace error:", err)
      } finally {
        setWorkspaceLoading(false)
      }
      return null
    },
    [workspaceId],
  )

  useEffect(() => {
    let isMounted = true
    const abortController = new AbortController()

    const checkAuth = async () => {
      // Handle hash fragment tokens (email verification)
      if (typeof window !== "undefined" && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get("access_token")
        const refreshToken = hashParams.get("refresh_token")

        if (accessToken) {
          console.log("[v0] Processing hash fragment auth token")
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || "",
            })

            if (!error && data?.session) {
              console.log("[v0] Session set from hash token")
              window.history.replaceState(null, "", window.location.pathname)
            }
          } catch (err) {
            console.error("[v0] Error setting session from hash:", err)
          }
        }
      }

      if (abortController.signal.aborted) return

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!isMounted || abortController.signal.aborted) return

      if (session?.user) {
        console.log("[v0] User authenticated:", session.user.email)
        setUser(session.user)
        await fetchOrCreateWorkspace(session.user.id, {
          ...session.user.user_metadata,
          email: session.user.email,
        })
      }

      if (isMounted) {
        setLoading(false)
      }
    }

    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state change:", event)

      if (!isMounted || abortController.signal.aborted) return

      if (event === "SIGNED_IN" && session?.user) {
        console.log("[v0] User signed in:", session.user.email)
        setUser(session.user)
        if (currentUserIdRef.current !== session.user.id) {
          await fetchOrCreateWorkspace(session.user.id, {
            ...session.user.user_metadata,
            email: session.user.email,
          })
        }
        if (isMounted) {
          setLoading(false)
        }
      } else if (event === "SIGNED_OUT") {
        console.log("[v0] User signed out")
        setUser(null)
        setWorkspaceId(null)
        workspaceFetchedRef.current = false
        currentUserIdRef.current = null
        if (isMounted) {
          setLoading(false)
        }
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        // Just update user, don't refetch workspace
        setUser(session.user)
      }
    })

    return () => {
      isMounted = false
      abortController.abort()
      subscription.unsubscribe()
    }
  }, [fetchOrCreateWorkspace])

  if (loading || (user && workspaceLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{workspaceLoading ? "워크스페이스 로딩 중..." : "로딩 중..."}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  if (!workspaceId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <p className="text-gray-600 mb-4">워크스페이스를 불러오는 중 문제가 발생했습니다.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <TaskDashboard
      workspaceId={workspaceId}
      userId={user.id}
      userNickname={user.user_metadata?.nickname || user.user_metadata?.full_name}
      userEmail={user.email}
      onLogout={() => {
        setUser(null)
        setWorkspaceId(null)
        workspaceFetchedRef.current = false
        currentUserIdRef.current = null
      }}
    />
  )
}
