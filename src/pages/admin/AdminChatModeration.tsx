import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable, Column } from '@/components/admin/DataTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MessageCircleOff, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  chat_disabled: boolean | null;
  last_seen: string | null;
}

export default function AdminChat() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-chat-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, chat_disabled, last_seen')
        .order('last_seen', { ascending: false });

      if (error) throw error;
      return data as User[];
    },
  });

  const toggleChatMutation = useMutation({
    mutationFn: async ({ userId, disable }: { userId: string; disable: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ chat_disabled: disable })
        .eq('id', userId);

      if (error) throw error;

      await supabase.from('admin_activity_logs').insert({
        admin_id: currentUser?.id,
        action: disable ? 'Disabled chat for user' : 'Enabled chat for user',
        target_type: 'user',
        target_id: userId,
      });
    },
    onSuccess: (_, { disable }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-chat-users'] });
      toast.success(disable ? 'Chat disabled for user' : 'Chat enabled for user');
    },
    onError: (error) => {
      toast.error('Failed to update chat status: ' + error.message);
    },
  });

  const columns: Column<User>[] = [
    {
      key: 'user',
      header: 'User',
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.full_name || 'Unknown'}</p>
            <p className="text-sm text-muted-foreground">@{user.username || 'no-username'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'chat_status',
      header: 'Chat Status',
      render: (user) => (
        user.chat_disabled ? (
          <Badge variant="destructive">
            <MessageCircleOff className="h-3 w-3 mr-1" />
            Disabled
          </Badge>
        ) : (
          <Badge className="bg-green-500">
            <MessageCircle className="h-3 w-3 mr-1" />
            Enabled
          </Badge>
        )
      ),
    },
    {
      key: 'last_seen',
      header: 'Last Active',
      render: (user) => (
        <span className="text-sm text-muted-foreground">
          {user.last_seen 
            ? formatDistanceToNow(new Date(user.last_seen), { addSuffix: true })
            : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => (
        <Button
          variant={user.chat_disabled ? 'default' : 'destructive'}
          size="sm"
          onClick={() => toggleChatMutation.mutate({ 
            userId: user.id, 
            disable: !user.chat_disabled 
          })}
          disabled={toggleChatMutation.isPending}
        >
          {user.chat_disabled ? (
            <>
              <MessageCircle className="h-4 w-4 mr-2" />
              Enable Chat
            </>
          ) : (
            <>
              <MessageCircleOff className="h-4 w-4 mr-2" />
              Disable Chat
            </>
          )}
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout 
      title="Chat Moderation" 
      description="Manage user chat access and monitor suspicious activity"
    >
      <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border">
        <h3 className="font-medium mb-2">Chat Moderation Policy</h3>
        <p className="text-sm text-muted-foreground">
          Chat moderation allows you to disable chat functionality for specific users. 
          For privacy reasons, message content is not visible to administrators. 
          Only chat access status can be managed here.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Search users..."
        searchKey="full_name"
        isLoading={isLoading}
        filters={[
          {
            key: 'chat_status',
            label: 'Chat Status',
            options: [
              { value: 'enabled', label: 'Enabled' },
              { value: 'disabled', label: 'Disabled' },
            ],
          },
        ]}
      />
    </AdminLayout>
  );
}
