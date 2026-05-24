-- =====================================================
-- Migration 005: Assignment Submission System
-- Grandview Academy SMS
-- =====================================================

CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  term_id UUID REFERENCES terms(id) ON DELETE SET NULL,
  created_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ NOT NULL,
  max_score NUMERIC(5,2) DEFAULT 100.00,
  file_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  file_url TEXT,
  text_content TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  score NUMERIC(5,2),
  remarks TEXT,
  graded_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  graded_at TIMESTAMPTZ,
  UNIQUE(assignment_id, student_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id, term_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON assignment_submissions(student_id);
