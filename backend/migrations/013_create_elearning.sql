-- Migration: 013_create_elearning.sql

CREATE TABLE IF NOT EXISTS public.elearning_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    material_type VARCHAR(50) DEFAULT 'document', -- 'document', 'video', 'link'
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.staff(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying materials by class
CREATE INDEX IF NOT EXISTS idx_elearning_class_id ON public.elearning_materials(class_id);

-- Enable RLS
ALTER TABLE public.elearning_materials ENABLE ROW LEVEL SECURITY;

-- Staff can manage materials
DROP POLICY IF EXISTS "Staff can manage elearning" ON public.elearning_materials;
CREATE POLICY "Staff can manage elearning"
    ON public.elearning_materials
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'teaching_staff')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'teaching_staff')
        )
    );

-- Students can view materials assigned to their class
DROP POLICY IF EXISTS "Students can view their class materials" ON public.elearning_materials;
CREATE POLICY "Students can view their class materials"
    ON public.elearning_materials
    FOR SELECT
    USING (
        class_id IN (
            SELECT class_id FROM public.students WHERE user_id = auth.uid()
        )
    );
