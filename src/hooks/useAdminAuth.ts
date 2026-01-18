import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type AdminRole = 'super_admin' | 'content_moderator' | 'category_manager';

interface AdminAuthState {
  isAdmin: boolean;
  roles: AdminRole[];
  loading: boolean;
  isSuperAdmin: boolean;
  isContentModerator: boolean;
  isCategoryManager: boolean;
}

export function useAdminAuth(): AdminAuthState {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminRoles() {
      if (!user) {
        setRoles([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error checking admin roles:', error);
          setRoles([]);
        } else {
          setRoles((data || []).map(r => r.role as AdminRole));
        }
      } catch (err) {
        console.error('Error in admin auth check:', err);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      checkAdminRoles();
    }
  }, [user, authLoading]);

  return {
    isAdmin: roles.length > 0,
    roles,
    loading: authLoading || loading,
    isSuperAdmin: roles.includes('super_admin'),
    isContentModerator: roles.includes('content_moderator') || roles.includes('super_admin'),
    isCategoryManager: roles.includes('category_manager') || roles.includes('super_admin'),
  };
}
