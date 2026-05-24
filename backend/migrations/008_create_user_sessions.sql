-- Migration: 008_create_user_sessions.sql

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token_id VARCHAR(255) NOT NULL UNIQUE, -- JTI or some unique identifier in the JWT
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by user and active status
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_id ON public.user_sessions(token_id);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Admins can view all sessions
DROP POLICY IF EXISTS "Admins can view all user sessions" ON public.user_sessions;
CREATE POLICY "Admins can view all user sessions"
    ON public.user_sessions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Users can view their own sessions
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
CREATE POLICY "Users can view their own sessions"
    ON public.user_sessions
    FOR SELECT
    USING (user_id = auth.uid());

-- Service role policies
DROP POLICY IF EXISTS "Allow authenticated inserts and updates" ON public.user_sessions;
CREATE POLICY "Allow authenticated inserts and updates"
    ON public.user_sessions
    FOR ALL
    USING (true)
    WITH CHECK (true);
