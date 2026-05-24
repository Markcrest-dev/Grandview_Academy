-- Migration: 012_create_payroll.sql

CREATE TABLE IF NOT EXISTS public.payroll_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    base_salary DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    bonus DECIMAL(10, 2) DEFAULT 0.00,
    deductions DECIMAL(10, 2) DEFAULT 0.00,
    net_pay DECIMAL(10, 2) GENERATED ALWAYS AS (base_salary + bonus - deductions) STORED,
    month INTEGER NOT NULL, -- 1 to 12
    year INTEGER NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(staff_id, month, year)
);

-- Enable RLS
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

-- Admins and Bursars can manage payroll
DROP POLICY IF EXISTS "Finance can manage payroll" ON public.payroll_records;
CREATE POLICY "Finance can manage payroll"
    ON public.payroll_records
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR 
                (users.role = 'non_teaching_staff' AND EXISTS (SELECT 1 FROM public.staff WHERE user_id = auth.uid() AND department ILIKE '%bursary%')))
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR 
                (users.role = 'non_teaching_staff' AND EXISTS (SELECT 1 FROM public.staff WHERE user_id = auth.uid() AND department ILIKE '%bursary%')))
        )
    );

-- Staff can view their own payroll
DROP POLICY IF EXISTS "Staff can view own payroll" ON public.payroll_records;
CREATE POLICY "Staff can view own payroll"
    ON public.payroll_records
    FOR SELECT
    USING (
        staff_id IN (
            SELECT id FROM public.staff WHERE user_id = auth.uid()
        )
    );
