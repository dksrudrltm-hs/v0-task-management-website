"use client"

const WORKSPACE_KEY = "current_workspace_key"

export function saveWorkspaceKey(key: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(WORKSPACE_KEY, key)
  }
}

export function getWorkspaceKey(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(WORKSPACE_KEY)
  }
  return null
}

export function clearWorkspaceKey() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(WORKSPACE_KEY)
  }
}
