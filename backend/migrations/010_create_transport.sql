-- Migration: 010_create_transport.sql

CREATE TABLE IF NOT EXISTS public.transport_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    vehicle_details VARCHAR(255),
    driver_name VARCHAR(255),
    driver_phone VARCHAR(50),
    fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transport_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES public.transport_routes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active', -- active, inactive
    UNIQUE(route_id, student_id)
);

-- Enable RLS
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_assignments ENABLE ROW LEVEL SECURITY;

-- Admins and staff can view routes
DROP POLICY IF EXISTS "Staff can view routes" ON public.transport_routes;
CREATE POLICY "Staff can view routes"
    ON public.transport_routes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'teaching_staff', 'non_teaching_staff')
        )
    );

-- Admins can manage routes
DROP POLICY IF EXISTS "Admins can manage routes" ON public.transport_routes;
CREATE POLICY "Admins can manage routes"
    ON public.transport_routes
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

-- Admins can manage assignments
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.transport_assignments;
CREATE POLICY "Admins can manage assignments"
    ON public.transport_assignments
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

-- Students/Parents can view their own assignments
DROP POLICY IF EXISTS "Students can view their transport" ON public.transport_assignments;
CREATE POLICY "Students can view their transport"
    ON public.transport_assignments
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
