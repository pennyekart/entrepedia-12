import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { ActivityLog } from '@/components/admin/ActivityLog';
import { useAdminStats } from '@/hooks/useAdminStats';
import { 
  Users, 
  Building2, 
  FileText, 
  Users2, 
  Flag, 
  Star,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = ['hsl(330, 85%, 60%)', 'hsl(210, 90%, 55%)', 'hsl(195, 85%, 50%)', 'hsl(150, 70%, 50%)', 'hsl(45, 90%, 55%)'];

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();

  const { data: categoryData } = useQuery({
    queryKey: ['admin-category-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('category');

      if (error) throw error;

      const counts = (data || []).reduce((acc, b) => {
        acc[b.category] = (acc[b.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(counts)
        .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    },
  });

  const { data: weeklyData } = useQuery({
    queryKey: ['admin-weekly-posts'],
    queryFn: async () => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('posts')
        .select('created_at')
        .gte('created_at', oneWeekAgo.toISOString());

      if (error) throw error;

      const countsByDay = days.map((day, index) => ({
        name: day,
        posts: 0,
      }));

      (data || []).forEach((post) => {
        const dayIndex = new Date(post.created_at!).getDay();
        countsByDay[dayIndex].posts++;
      });

      return countsByDay;
    },
  });

  return (
    <AdminLayout 
      title="Dashboard" 
      description="Overview of your platform metrics and activity"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Users"
          value={statsLoading ? '...' : stats?.totalUsers || 0}
          icon={Users}
        />
        <StatsCard
          title="Active Today"
          value={statsLoading ? '...' : stats?.activeUsersToday || 0}
          icon={Activity}
        />
        <StatsCard
          title="Businesses"
          value={statsLoading ? '...' : stats?.totalBusinesses || 0}
          icon={Building2}
        />
        <StatsCard
          title="Posts"
          value={statsLoading ? '...' : stats?.totalPosts || 0}
          icon={FileText}
        />
        <StatsCard
          title="Communities"
          value={statsLoading ? '...' : stats?.totalCommunities || 0}
          icon={Users2}
        />
        <StatsCard
          title="Pending Reports"
          value={statsLoading ? '...' : stats?.pendingReports || 0}
          icon={Flag}
          className={stats?.pendingReports ? 'border-destructive/50' : ''}
        />
        <StatsCard
          title="Featured Businesses"
          value={statsLoading ? '...' : stats?.featuredBusinesses || 0}
          icon={Star}
        />
        <StatsCard
          title="Growth Rate"
          value="+12%"
          icon={TrendingUp}
          trend={{ value: 12, isPositive: true }}
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Posts Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Posts This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar 
                    dataKey="posts" 
                    fill="hsl(330, 85%, 60%)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(categoryData || []).map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CHART_COLORS[index % CHART_COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {(categoryData || []).map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-sm text-muted-foreground flex-1">{item.name}</span>
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      <div className="mt-6">
        <ActivityLog />
      </div>
    </AdminLayout>
  );
}
