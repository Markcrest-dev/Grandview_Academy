-- Migration: 011_create_hostels.sql

CREATE TABLE IF NOT EXISTS public.hostels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    gender_type VARCHAR(50) NOT NULL, -- 'boys', 'girls', 'mixed'
    capacity INTEGER NOT NULL,
    fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hostel_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostel_id UUID REFERENCES public.hostels(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    room_number VARCHAR(50),
    allocated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive'
    UNIQUE(hostel_id, student_id)
);

-- Enable RLS
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_allocations ENABLE ROW LEVEL SECURITY;

-- Admins and staff can view hostels
DROP POLICY IF EXISTS "Staff can view hostels" ON public.hostels;
CREATE POLICY "Staff can view hostels"
    ON public.hostels
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'teaching_staff', 'non_teaching_staff')
        )
    );

-- Admins can manage hostels
DROP POLICY IF EXISTS "Admins can manage hostels" ON public.hostels;
CREATE POLICY "Admins can manage hostels"
    ON public.hostels
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Admins can manage allocations
DROP POLICY IF EXISTS "Admins can manage allocations" ON public.hostel_allocations;
CREATE POLICY "Admins can manage allocations"
    ON public.hostel_allocations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Students/Parents can view their own allocations
DROP POLICY IF EXISTS "Students can view their allocations" ON public.hostel_allocations;
CREATE POLICY "Students can view their allocations"
    ON public.hostel_allocations
    FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
        OR
        student_id IN (
            SELECT student_id FROM public.parent_student 
            WHERE parent_id IN (SELECT id FROM public.parents WHERE user_id = auth.uid())
        )
    );
