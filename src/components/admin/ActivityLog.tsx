import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  UserCog, 
  Shield, 
  FileText, 
  Building2, 
  Flag,
  AlertCircle
} from 'lucide-react';

interface ActivityLogEntry {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const getActionIcon = (action: string) => {
  if (action.includes('user')) return UserCog;
  if (action.includes('role')) return Shield;
  if (action.includes('post')) return FileText;
  if (action.includes('business')) return Building2;
  if (action.includes('report')) return Flag;
  return AlertCircle;
};

export function ActivityLog() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['admin-activity-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as ActivityLogEntry[];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/4 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No activity logged yet
            </p>
          ) : (
            <div className="space-y-4">
              {activities?.map((activity) => {
                const Icon = getActionIcon(activity.action);
                return (
                  <div key={activity.id} className="flex gap-3">
                    <div className="rounded-full bg-primary/10 p-2 h-fit">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.target_type}
                        {activity.created_at && (
                          <> • {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
