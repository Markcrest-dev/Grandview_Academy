CREATE TABLE IF NOT EXISTS public.alumni_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  graduation_year INTEGER NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.alumni_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (submission) and admin access (management)
CREATE POLICY "Enable public insertions" ON public.alumni_applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable full access for admins" ON public.alumni_applications
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
