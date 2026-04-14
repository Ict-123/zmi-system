
-- Add 'parent' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'parent';

-- Create parent_student_links table
CREATE TABLE public.parent_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL,
  student_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

-- Parents can read their own links
CREATE POLICY "Parents can read own links"
  ON public.parent_student_links FOR SELECT
  TO authenticated
  USING (parent_user_id = auth.uid());

-- Admins can manage all links
CREATE POLICY "Admins can manage parent links (select)"
  ON public.parent_student_links FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert parent links"
  ON public.parent_student_links FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete parent links"
  ON public.parent_student_links FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create user_profiles table to link auth users to student records
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  student_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all profiles (select)"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert profiles"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update profiles"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
