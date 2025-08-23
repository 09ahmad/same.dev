// components/workspace/WorkspaceSidebar.tsx
import React, { useState, useEffect } from 'react';
import { Code2, Plus, Trash2, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  className?: string;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  userId,
  activeConversationId,
  onConversationSelect,
  onNewWorkspace,
  onDeleteConversation,
  className = ""
}) => {
  const [conversations, setConversations] = useState<WorkspaceConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch workspace conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workspace/history/${userId}`);
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
      const response = await fetch(`/api/conversation/${conversationId}`, {
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

  const truncateTitle = (title: string, maxLength = 35) => {
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
      <div className={`w-80 bg-white border-r border-gray-200 flex flex-col ${className}`}>
        <div className="p-4 border-b border-gray-200">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-80 bg-white border-r border-gray-200 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <Button 
          onClick={onNewWorkspace}
          className="w-full justify-start gap-2 hover:bg-gray-50"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          New Workspace
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {conversations.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Code2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">No workspaces yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Create your first workspace to get started
              </p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={`p-3 cursor-pointer transition-all group hover:shadow-md border ${
                  activeConversationId === conversation.id 
                    ? 'bg-blue-50 border-blue-200 shadow-sm' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => onConversationSelect(conversation.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Template Badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">{getTemplateIcon(conversation.template)}</span>
                      {conversation.template && (
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          {conversation.template.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Title */}
                    <h3 className="font-medium text-sm mb-2 text-gray-900">
                      {truncateTitle(conversation.title)}
                    </h3>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-1">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {conversation._count.files} files
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(conversation.updatedAt)}
                      </span>
                    </div>
                    
                    {/* Original Prompt Preview */}
                    {conversation.prompt && (
                      <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                        {conversation.prompt.substring(0, 60)}
                        {conversation.prompt.length > 60 ? '...' : ''}
                      </p>
                    )}
                  </div>
                  
                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 ml-2 p-1.5 h-auto text-gray-400 hover:text-red-500 hover:bg-red-50"
                    onClick={(e) => handleDeleteConversation(conversation.id, e)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
      
      {/* Footer Stats */}
      {conversations.length > 0 && (
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            {conversations.length} workspace{conversations.length !== 1 ? 's' : ''} total
          </p>
        </div>
      )}
    </div>
  );
};