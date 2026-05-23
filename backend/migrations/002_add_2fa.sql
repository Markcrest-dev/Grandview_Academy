-- ============================================================================
-- Grandview Academy School Management System (SMS)
-- Migration: Add 2-Factor Authentication Columns to Users (002_add_2fa.sql)
-- Target Database: PostgreSQL / Supabase
-- ============================================================================

-- Add two_factor_secret column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);

-- Add two_factor_enabled column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
