"use client"

import { useState, useEffect } from "react"
import { AuthForm } from "@/components/auth-form"
import { TaskDashboard } from "@/components/task-dashboard"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
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
              // Clear the hash from URL
              window.history.replaceState(null, "", window.location.pathname)
            }
          } catch (err) {
            console.error("[v0] Error setting session from hash:", err)
          }
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        console.log("[v0] User authenticated:", session.user.email)
        setUser(session.user)

        // Get or create workspace for user
        const { data: workspace } = await supabase
          .from("workspaces")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle()

        if (workspace) {
          setWorkspaceId(workspace.id)
        } else {
          const nickname =
            session.user.user_metadata?.nickname ||
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "사용자"
          const { data: newWorkspace } = await supabase
            .from("workspaces")
            .insert({
              name: `${nickname}의 워크스페이스`,
              user_id: session.user.id,
              workspace_key: crypto.randomUUID(),
            })
            .select("id")
            .single()

          if (newWorkspace) {
            setWorkspaceId(newWorkspace.id)
          }
        }
      }

      setLoading(false)
    }

    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state change:", event)
      if (session?.user) {
        setUser(session.user)
        const { data: workspace } = await supabase
          .from("workspaces")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle()

        if (workspace) {
          setWorkspaceId(workspace.id)
        } else {
          const nickname =
            session.user.user_metadata?.nickname ||
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "사용자"
          const { data: newWorkspace } = await supabase
            .from("workspaces")
            .insert({
              name: `${nickname}의 워크스페이스`,
              user_id: session.user.id,
              workspace_key: crypto.randomUUID(),
            })
            .select("id")
            .single()

          if (newWorkspace) {
            setWorkspaceId(newWorkspace.id)
          }
        }
        setLoading(false)
      } else {
        setUser(null)
        setWorkspaceId(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user || !workspaceId) {
    return <AuthForm />
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
      }}
    />
  )
}
