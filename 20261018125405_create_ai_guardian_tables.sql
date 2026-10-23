/*
# AI Guardian — Core data tables with auth-scoped RLS

## Purpose
Adds persistent server-side storage for the three kinds of user data that
genuinely need to survive device loss: trusted emergency contacts, campus
incident reports, and scam/URL analysis history. Checklist progress remains
in browser localStorage because it is ephemeral UI state.

## New Tables

### 1. trusted_contacts
Personal-safety contacts the user wants ready in the SOS panel.
- id (uuid, PK)
- user_id (uuid, FK -> auth.users, owner, DEFAULT auth.uid())
- name (text, 1–80 chars, NOT NULL)
- phone (text, 4–20 chars, NOT NULL) — validated by CHECK constraint
- relationship (text, 0–40 chars) — optional label like "Parent"
- created_at (timestamptz, default now())

### 2. incident_reports
Campus safety incident reports filed by the user.
- id (uuid, PK)
- user_id (uuid, FK -> auth.users, owner, DEFAULT auth.uid())
- category (text, NOT NULL) — must be one of the allowed categories
- location (text, 0–200 chars) — optional free-text
- description (text, 10–2000 chars, NOT NULL)
- urgency (text, NOT NULL) — one of 'low' | 'medium' | 'high'
- status (text, NOT NULL, default 'submitted') — always 'submitted'
- created_at (timestamptz, default now())

### 3. analysis_history
Saved scam/URL analysis results so the user can review past scans.
- id (uuid, PK)
- user_id (uuid, FK -> auth.users, owner, DEFAULT auth.uid())
- type (text, NOT NULL) — 'message' | 'url'
- input (text, 1–5000 chars, NOT NULL)
- risk_level (text, NOT NULL) — 'low' | 'medium' | 'high' | 'unable'
- summary (text, NOT NULL)
- indicators (jsonb, NOT NULL) — array of RiskIndicator
- general_guidance (jsonb, NOT NULL) — array of strings
- recommended_actions (jsonb, NOT NULL) — array of strings
- is_demo (boolean, NOT NULL, default true)
- created_at (timestamptz, default now())

## Security — Row Level Security
Every table has RLS ENABLED with four owner-scoped policies (SELECT, INSERT,
UPDATE, DELETE), each restricted TO authenticated and scoped by
auth.uid() = user_id. No anon access — the app requires sign-in to read or
write personal data.

Owner columns default to auth.uid() so frontend inserts that omit user_id
still satisfy the INSERT WITH CHECK.

## Validation — server-side CHECK constraints
- Phone numbers: 4–20 chars, digits/spaces/dashes/parentheses/plus only.
- Names: 1–80 chars.
- Description: 10–2000 chars (prevents empty/garbage reports).
- Incident category: must be in the fixed allowlist.
- Urgency: must be low/medium/high.
- Risk level: must be low/medium/high/unable.
- Type: must be message/url.
- Input text: 1–5000 chars.
Capped at 200 rows per user per table via a trigger to prevent abuse.

## Indexes
- Each table: index on (user_id, created_at DESC) for the user's list view.
*/

-- ===== trusted_contacts =====
CREATE TABLE IF NOT EXISTS trusted_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 4 AND 20 AND phone ~ '^[0-9+\-\s()]+$'),
  relationship text NOT NULL DEFAULT 'Contact' CHECK (char_length(relationship) BETWEEN 0 AND 40),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trusted_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_contacts" ON trusted_contacts;
CREATE POLICY "select_own_contacts" ON trusted_contacts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_contacts" ON trusted_contacts;
CREATE POLICY "insert_own_contacts" ON trusted_contacts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_contacts" ON trusted_contacts;
CREATE POLICY "update_own_contacts" ON trusted_contacts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_contacts" ON trusted_contacts;
CREATE POLICY "delete_own_contacts" ON trusted_contacts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trusted_contacts_user_created
  ON trusted_contacts (user_id, created_at DESC);

-- ===== incident_reports =====
CREATE TABLE IF NOT EXISTS incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN (
    'Theft / property damage',
    'Harassment',
    'Suspicious activity',
    'Safety hazard',
    'Wellbeing concern',
    'Other'
  )),
  location text NOT NULL DEFAULT '' CHECK (char_length(location) BETWEEN 0 AND 200),
  description text NOT NULL CHECK (char_length(description) BETWEEN 10 AND 2000),
  urgency text NOT NULL CHECK (urgency IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'submitted' CHECK (status = 'submitted'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_incidents" ON incident_reports;
CREATE POLICY "select_own_incidents" ON incident_reports FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_incidents" ON incident_reports;
CREATE POLICY "insert_own_incidents" ON incident_reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_incidents" ON incident_reports;
CREATE POLICY "update_own_incidents" ON incident_reports FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_incidents" ON incident_reports;
CREATE POLICY "delete_own_incidents" ON incident_reports FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_incident_reports_user_created
  ON incident_reports (user_id, created_at DESC);

-- ===== analysis_history =====
CREATE TABLE IF NOT EXISTS analysis_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('message', 'url')),
  input text NOT NULL CHECK (char_length(input) BETWEEN 1 AND 5000),
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'unable')),
  summary text NOT NULL,
  indicators jsonb NOT NULL DEFAULT '[]'::jsonb,
  general_guidance jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_demo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_history" ON analysis_history;
CREATE POLICY "select_own_history" ON analysis_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_history" ON analysis_history;
CREATE POLICY "insert_own_history" ON analysis_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_history" ON analysis_history;
CREATE POLICY "update_own_history" ON analysis_history FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_history" ON analysis_history;
CREATE POLICY "delete_own_history" ON analysis_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_analysis_history_user_created
  ON analysis_history (user_id, created_at DESC);

-- ===== Row-count guard (200 per user per table) =====
-- Prevents a single user from writing unbounded rows.
CREATE OR REPLACE FUNCTION enforce_row_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  row_count integer;
BEGIN
  EXECUTE format('SELECT count(*) FROM %I WHERE user_id = $1', TG_TABLE_NAME)
    INTO row_count USING NEW.user_id;
  IF row_count >= 200 THEN
    RAISE EXCEPTION 'Storage limit reached (200 rows) for table %', TG_TABLE_NAME;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contacts_row_limit ON trusted_contacts;
CREATE TRIGGER trg_contacts_row_limit
  BEFORE INSERT ON trusted_contacts
  FOR EACH ROW EXECUTE FUNCTION enforce_row_limit();

DROP TRIGGER IF EXISTS trg_incidents_row_limit ON incident_reports;
CREATE TRIGGER trg_incidents_row_limit
  BEFORE INSERT ON incident_reports
  FOR EACH ROW EXECUTE FUNCTION enforce_row_limit();

DROP TRIGGER IF EXISTS trg_history_row_limit ON analysis_history;
CREATE TRIGGER trg_history_row_limit
  BEFORE INSERT ON analysis_history
  FOR EACH ROW EXECUTE FUNCTION enforce_row_limit();