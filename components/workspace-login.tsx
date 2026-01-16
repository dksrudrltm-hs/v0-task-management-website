"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { saveWorkspaceKey } from "@/lib/workspace-storage"
import { CalendarDays } from "lucide-react"

interface WorkspaceLoginProps {
  onLogin: (workspaceId: string) => void
}

export function WorkspaceLogin({ onLogin }: WorkspaceLoginProps) {
  const [loginKey, setLoginKey] = useState("")
  const [newWorkspaceName, setNewWorkspaceName] = useState("")
  const [newWorkspaceKey, setNewWorkspaceKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from("workspaces")
        .select("*")
        .eq("workspace_key", loginKey)
        .single()

      if (fetchError || !data) {
        setError("워크스페이스를 찾을 수 없습니다.")
        setLoading(false)
        return
      }

      saveWorkspaceKey(loginKey)
      onLogin(data.id)
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: createError } = await supabase
        .from("workspaces")
        .insert([
          {
            name: newWorkspaceName,
            workspace_key: newWorkspaceKey,
          },
        ])
        .select()
        .single()

      if (createError) {
        if (createError.code === "23505") {
          setError("이미 사용 중인 워크스페이스 키입니다.")
        } else {
          setError("워크스페이스 생성 중 오류가 발생했습니다.")
        }
        setLoading(false)
        return
      }

      saveWorkspaceKey(newWorkspaceKey)
      onLogin(data.id)
    } catch (err) {
      setError("워크스페이스 생성 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <CalendarDays className="w-7 h-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">일정 관리</CardTitle>
          <CardDescription className="text-base">워크스페이스 키로 나만의 공간에 접속하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">로그인</TabsTrigger>
              <TabsTrigger value="create">새로 만들기</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-key">워크스페이스 키</Label>
                  <Input
                    id="login-key"
                    type="text"
                    placeholder="워크스페이스 키를 입력하세요"
                    value={loginKey}
                    onChange={(e) => setLoginKey(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "로그인 중..." : "로그인"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="create">
              <form onSubmit={handleCreateWorkspace} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workspace-name">워크스페이스 이름</Label>
                  <Input
                    id="workspace-name"
                    type="text"
                    placeholder="나의 워크스페이스"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workspace-key">워크스페이스 키</Label>
                  <Input
                    id="workspace-key"
                    type="text"
                    placeholder="고유한 키를 설정하세요"
                    value={newWorkspaceKey}
                    onChange={(e) => setNewWorkspaceKey(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">이 키를 기억해두세요. 나중에 로그인할 때 필요합니다.</p>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "생성 중..." : "워크스페이스 생성"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
