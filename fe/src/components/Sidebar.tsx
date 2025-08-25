import { Plus, MessageCircle, Trash2 } from "lucide-react"
import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
} from "@/components/ui/sidebar"
import { createChatConversation, deleteConversation, fetchAllConversations, type Conversation } from "@/lib/history"

export function AppSidebar() {
  const router = useRouter()
  const { data: session } = useSession()
  const userId = (session as any)?.user?.id as string | undefined

  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = async () => {
    if (!userId) return
    try {
      setLoading(true)
      const data = await fetchAllConversations(userId)
      setConversations(data)
      if (!activeConversationId && data.length > 0) {
        setActiveConversationId(data[0].id)
      }
      setError(null)
    } catch (e) {
      setError("Failed to load history")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const onNewChat = async () => {
    if (!userId) return
    try {
      const conv = await createChatConversation({ userId, title: "New conversation" })
      setConversations(x => [conv, ...x])
      setActiveConversationId(conv.id)
    } catch (e) {
      setError("Failed to create conversation")
    }
  }

  const onOpenConversation = (conv: Conversation) => {
    setActiveConversationId(conv.id)
    if (conv.type === 'workspace') {
      router.push(`/workspace?conversationId=${conv.id}`)
    } else {
      router.push("/")
    }
  }

  const onDelete = async (id: string) => {
    try {
      await deleteConversation(id)
      setConversations(x => x.filter(c => c.id !== id))
      if (activeConversationId === id) setActiveConversationId(null)
    } catch (e) {
      setError("Failed to delete conversation")
    }
  }

  const firstUserSnippet = (conv: Conversation) => {
    const firstUser = conv.messages?.find(m => m.role === 'user')?.content || conv.title || ''
    const words = firstUser.trim().split(/\s+/)
    const slice = words.slice(0, 10)
    return slice.join(' ') + (words.length > slice.length ? '…' : '')
  }

  const formatted = useMemo(() => conversations.map(c => ({
    id: c.id,
    title: firstUserSnippet(c),
    updatedAt: c.updatedAt,
    type: c.type || 'chat',
    original: c,
  })), [conversations])

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onNewChat} className="w-full">
                  <Plus />
                  <span>New Chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {error && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="mx-4 p-3 text-xs rounded border border-red-200 text-red-600 bg-red-50">{error}</div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Recent</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading && (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <span>Loading...</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {!loading && formatted.length === 0 && (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <span>No conversations</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {formatted.map(item => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onOpenConversation(item.original)}
                    isActive={activeConversationId === item.id}
                    className="justify-start h-auto p-3 group relative"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <MessageCircle className="w-4 h-4" />
                      <span className="truncate">{item.title}</span>
                    </div>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    showOnHover
                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                    aria-label="Delete conversation"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3 h-3" />
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
