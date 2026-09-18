-- Code Assignments: backup/audit for who was assigned which code (email, name, code).
-- Admins upload CSV/Excel; data accumulates over time. Searchable by name, email, or code.

CREATE TABLE IF NOT EXISTS ra_cadet_code_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_code_assignments_email ON ra_cadet_code_assignments(email);
CREATE INDEX IF NOT EXISTS idx_code_assignments_code ON ra_cadet_code_assignments(code);
CREATE INDEX IF NOT EXISTS idx_code_assignments_name ON ra_cadet_code_assignments(name);

ALTER TABLE ra_cadet_code_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ra_cadet_code_assignments are viewable by everyone"
  ON ra_cadet_code_assignments FOR SELECT
  USING (true);

CREATE POLICY "ra_cadet_code_assignments are insertable"
  ON ra_cadet_code_assignments FOR INSERT
  WITH CHECK (true);
