CREATE TABLE IF NOT EXISTS public.alumni_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  graduation_year INTEGER NOT NULL CHECK (graduation_year > 1900 AND graduation_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 5),
  email VARCHAR(100) UNIQUE NOT NULL,
  phone_number VARCHAR(50),
  current_occupation VARCHAR(255),
  company_name VARCHAR(255),
  linkedin_profile VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster lookups in the admin dashboard
CREATE INDEX idx_alumni_applications_status ON public.alumni_applications(status);
CREATE INDEX idx_alumni_applications_email ON public.alumni_applications(email);
CREATE INDEX idx_alumni_applications_graduation_year ON public.alumni_applications(graduation_year);

-- Enable Row Level Security (RLS)
ALTER TABLE public.alumni_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (submission) and admin access (management)
CREATE POLICY "Enable public insertions" ON public.alumni_applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable full access for admins" ON public.alumni_applications
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
