-- Migration: Create Admission Applications Table
-- Description: Scaffold table to track incoming student applications and parent details.

CREATE TABLE IF NOT EXISTS public.admission_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20) NOT NULL,
  level VARCHAR(50) NOT NULL, -- 'primary', 'secondary', 'university'
  previous_school VARCHAR(255),
  grade_applied_for VARCHAR(100),
  photo_url VARCHAR(255),
  
  -- Parent / Guardian Details
  parent_first_name VARCHAR(100) NOT NULL,
  parent_last_name VARCHAR(100) NOT NULL,
  parent_email VARCHAR(100) NOT NULL,
  parent_phone VARCHAR(50) NOT NULL,
  parent_relationship VARCHAR(50) NOT NULL,
  parent_address TEXT NOT NULL,
  
  -- Application Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'under_review', 'approved', 'rejected'
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.admission_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (submission) and admin access (management)
CREATE POLICY "Enable public insertions" ON public.admission_applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable full access for admins" ON public.admission_applications
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
