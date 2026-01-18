import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, GripVertical, Pencil, Trash2, Power, PowerOff } from 'lucide-react';
import { Constants } from '@/integrations/supabase/types';

interface Category {
  name: string;
  displayName: string;
  isEnabled: boolean;
  order: number;
}

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Get categories from constants
  const categories: Category[] = Constants.public.Enums.business_category.map((cat, index) => ({
    name: cat,
    displayName: cat.charAt(0).toUpperCase() + cat.slice(1),
    isEnabled: true,
    order: index,
  }));

  // Get category usage counts
  const { data: categoryCounts } = useQuery({
    queryKey: ['category-counts'],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      
      for (const cat of Constants.public.Enums.business_category) {
        const { count } = await supabase
          .from('businesses')
          .select('id', { count: 'exact', head: true })
          .eq('category', cat);
        counts[cat] = count || 0;
      }
      
      return counts;
    },
  });

  return (
    <AdminLayout 
      title="Category Management" 
      description="Manage business categories and their display order"
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Business Categories</CardTitle>
            <CardDescription>
              Categories are defined in the database schema. Contact support to add new categories.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categories.map((category, index) => (
              <div
                key={category.name}
                className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{category.displayName}</span>
                    <Badge variant="secondary" className="text-xs">
                      {categoryCounts?.[category.name] || 0} businesses
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Identifier: {category.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500">
                    <Power className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 rounded-lg border border-dashed border-border bg-muted/30">
            <p className="text-sm text-muted-foreground text-center">
              To add new categories, a database migration is required. 
              This ensures data integrity across the platform.
            </p>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
