-- Create admin role enum
CREATE TYPE public.admin_role AS ENUM ('super_admin', 'content_moderator', 'category_manager');

-- Create user_roles table for admin roles (separate from profiles to prevent privilege escalation)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role admin_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- Create admin_activity_logs table
CREATE TABLE public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create reports table
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reported_type TEXT NOT NULL CHECK (reported_type IN ('post', 'user', 'business', 'community', 'comment')),
    reported_id UUID NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    evidence_urls TEXT[],
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    action_taken TEXT,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create featured_content table
CREATE TABLE public.featured_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL CHECK (content_type IN ('post', 'business')),
    content_id UUID NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE,
    placement INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create platform_settings table
CREATE TABLE public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create user_suspensions table
CREATE TABLE public.user_suspensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reason TEXT NOT NULL,
    suspended_by UUID REFERENCES auth.users(id),
    suspended_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_permanent BOOLEAN DEFAULT false,
    lifted_at TIMESTAMP WITH TIME ZONE,
    lifted_by UUID REFERENCES auth.users(id)
);

-- Add is_blocked and chat_disabled to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS chat_disabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES auth.users(id);

-- Add is_disabled to communities
ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS disabled_reason TEXT;

-- Add is_hidden to posts
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS hidden_reason TEXT;

-- Add is_disabled and approval status to businesses
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS disabled_reason TEXT;

-- Enable RLS on all new tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_suspensions ENABLE ROW LEVEL SECURITY;

-- Create has_role function (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role admin_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create has_any_admin_role function
CREATE OR REPLACE FUNCTION public.has_any_admin_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Super admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for admin_activity_logs
CREATE POLICY "Admins can view activity logs"
ON public.admin_activity_logs FOR SELECT
TO authenticated
USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Admins can create activity logs"
ON public.admin_activity_logs FOR INSERT
TO authenticated
WITH CHECK (public.has_any_admin_role(auth.uid()) AND admin_id = auth.uid());

-- RLS Policies for reports
CREATE POLICY "Users can create reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view their own reports"
ON public.reports FOR SELECT
TO authenticated
USING (reporter_id = auth.uid() OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "Admins can update reports"
ON public.reports FOR UPDATE
TO authenticated
USING (public.has_any_admin_role(auth.uid()));

-- RLS Policies for featured_content
CREATE POLICY "Everyone can view featured content"
ON public.featured_content FOR SELECT
USING (true);

CREATE POLICY "Admins can manage featured content"
ON public.featured_content FOR ALL
TO authenticated
USING (public.has_any_admin_role(auth.uid()));

-- RLS Policies for platform_settings
CREATE POLICY "Everyone can view platform settings"
ON public.platform_settings FOR SELECT
USING (true);

CREATE POLICY "Super admins can manage settings"
ON public.platform_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for user_suspensions
CREATE POLICY "Admins can view suspensions"
ON public.user_suspensions FOR SELECT
TO authenticated
USING (public.has_any_admin_role(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Admins can manage suspensions"
ON public.user_suspensions FOR ALL
TO authenticated
USING (public.has_any_admin_role(auth.uid()));

-- Insert default platform settings
INSERT INTO public.platform_settings (key, value) VALUES
    ('platform_name', '"സംരംഭക.com"'),
    ('platform_logo', '"/assets/logo.jpeg"'),
    ('features_enabled', '{"chat": true, "communities": true, "posting": true}'),
    ('terms_conditions', '"Terms and conditions content here..."'),
    ('privacy_policy', '"Privacy policy content here..."'),
    ('community_guidelines', '"Community guidelines content here..."')
ON CONFLICT (key) DO NOTHING;