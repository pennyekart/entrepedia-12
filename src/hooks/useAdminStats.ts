import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdminStats {
  totalUsers: number;
  activeUsersToday: number;
  totalBusinesses: number;
  totalPosts: number;
  totalCommunities: number;
  pendingReports: number;
  featuredBusinesses: number;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStats> => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        usersResult,
        activeUsersResult,
        businessesResult,
        postsResult,
        communitiesResult,
        reportsResult,
        featuredResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true })
          .gte('last_seen', today.toISOString()),
        supabase.from('businesses').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('communities').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase.from('businesses').select('id', { count: 'exact', head: true })
          .eq('is_featured', true),
      ]);

      return {
        totalUsers: usersResult.count || 0,
        activeUsersToday: activeUsersResult.count || 0,
        totalBusinesses: businessesResult.count || 0,
        totalPosts: postsResult.count || 0,
        totalCommunities: communitiesResult.count || 0,
        pendingReports: reportsResult.count || 0,
        featuredBusinesses: featuredResult.count || 0,
      };
    },
    refetchInterval: 30000,
  });
}
