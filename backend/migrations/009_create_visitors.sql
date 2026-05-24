-- Migration: 009_create_visitors.sql

CREATE TABLE IF NOT EXISTS public.visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    purpose TEXT,
    host_name VARCHAR(255),
    sign_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sign_out_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active', -- 'active' or 'signed_out'
    recorded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying recent active visitors
CREATE INDEX IF NOT EXISTS idx_visitors_status ON public.visitors(status);
CREATE INDEX IF NOT EXISTS idx_visitors_sign_in ON public.visitors(sign_in_time DESC);

-- Enable RLS
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

-- Admins and staff can view visitors
DROP POLICY IF EXISTS "Staff can view visitors" ON public.visitors;
CREATE POLICY "Staff can view visitors"
    ON public.visitors
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'teaching_staff', 'non_teaching_staff')
        )
    );

-- Admins and non-teaching staff (like security) can insert visitors
DROP POLICY IF EXISTS "Staff can insert visitors" ON public.visitors;
CREATE POLICY "Staff can insert visitors"
    ON public.visitors
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'non_teaching_staff')
        )
    );

-- Admins and non-teaching staff can update visitors (e.g. sign out)
DROP POLICY IF EXISTS "Staff can update visitors" ON public.visitors;
CREATE POLICY "Staff can update visitors"
    ON public.visitors
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'non_teaching_staff')
        )
    );
