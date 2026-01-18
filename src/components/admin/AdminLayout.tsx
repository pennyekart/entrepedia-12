import { ReactNode, useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-4 z-50"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <AdminSidebar />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        "lg:ml-64", // Account for sidebar width
        "pt-16 lg:pt-0" // Account for mobile header
      )}>
        <div className="p-6 lg:p-8">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          {/* Page content */}
          {children}
        </div>
      </main>
    </div>
  );
}
