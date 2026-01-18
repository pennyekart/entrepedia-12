import { Navigate } from 'react-router-dom';
import { useAdminAuth, AdminRole } from '@/hooks/useAdminAuth';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: AdminRole;
}

export function AdminRoute({ children, requiredRole }: AdminRouteProps) {
  const { isAdmin, roles, loading, isSuperAdmin } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && !roles.includes(requiredRole) && !isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
