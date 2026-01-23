-- Add status column to posts table
-- Values: 'active' (default), 'hidden' (admin hidden)
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden'));

-- Update existing hidden posts to have 'hidden' status
UPDATE public.posts SET status = 'hidden' WHERE is_hidden = true;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);