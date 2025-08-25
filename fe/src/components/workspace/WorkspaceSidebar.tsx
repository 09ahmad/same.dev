import React, { useState, useEffect } from 'react';
import { Code2, Plus, Trash2, FileText, Calendar } from 'lucide-react';
import { BACKEND_URL2 } from '@/lib/config';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface WorkspaceConversation {
  id: string;
  title: string;
  prompt?: string;
  template?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    files: number;
    messages: number;
  };
}

interface WorkspaceSidebarProps {
  userId: string;
  activeConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  onNewWorkspace: () => void;
  onDeleteConversation: (conversationId: string) => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  userId,
  activeConversationId,
  onConversationSelect,
  onNewWorkspace,
  onDeleteConversation,
}) => {
  const [conversations, setConversations] = useState<WorkspaceConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch workspace conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL2}/api/workspace/history/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch conversations');
      
      const data = await response.json();
      setConversations(data);
      setError(null);
    } catch (err) {
      setError('Failed to load workspace history');
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchConversations();
    }
  }, [userId]);

  const handleDeleteConversation = async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const response = await fetch(`${BACKEND_URL2}/api/conversation/${conversationId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete conversation');
      
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      onDeleteConversation(conversationId);
    } catch (err) {
      setError('Failed to delete conversation');
      console.error('Error deleting conversation:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const truncateTitle = (title: string, maxLength = 30) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  const getTemplateIcon = (template?: string) => {
    switch (template?.toLowerCase()) {
      case 'react':
        return '⚛️';
      case 'next':
        return '▲';
      case 'node':
        return '🟢';
      default:
        return '💻';
    }
  };

  if (loading) {
    return (
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <SidebarContent>
        {/* New Workspace Button */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onNewWorkspace} className="w-full">
                  <Plus className="w-4 h-4" />
                  <span>New Workspace</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Error Display */}
        {error && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="mx-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Conversations List */}
        <SidebarGroup>
          <SidebarGroupLabel>Recent Workspaces</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {conversations.length === 0 ? (
                <div className="text-center text-gray-500 py-8 px-4">
                  <Code2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No workspaces yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Create your first workspace
                  </p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <SidebarMenuItem key={conversation.id}>
                    <SidebarMenuButton
                      onClick={() => onConversationSelect(conversation.id)}
                      isActive={activeConversationId === conversation.id}
                      className="w-full justify-start h-auto p-3 group relative"
                    >
                      <div className="flex flex-col items-start w-full min-w-0">
                        {/* Template and Title */}
                        <div className="flex items-center gap-2 w-full mb-1">
                          <span className="text-sm flex-shrink-0">
                            {getTemplateIcon(conversation.template)}
                          </span>
                          <span className="font-medium text-sm truncate">
                            {truncateTitle(conversation.title)}
                          </span>
                        </div>
                        
                        {/* Stats */}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {conversation._count.files}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(conversation.updatedAt)}
                          </span>
                        </div>
                        
                        {/* Original Prompt Preview */}
                        {conversation.prompt && (
                          <p className="text-xs text-gray-400 line-clamp-1 mt-1 w-full">
                            {conversation.prompt.substring(0, 40)}
                            {conversation.prompt.length > 40 ? '...' : ''}
                          </p>
                        )}
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                        onClick={(e) => handleDeleteConversation(conversation.id, e)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Footer Stats */}
        {conversations.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="px-4 py-2 text-center">
                <p className="text-xs text-gray-500">
                  {conversations.length} workspace{conversations.length !== 1 ? 's' : ''} total
                </p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
};