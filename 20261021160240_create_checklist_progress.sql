/*
# Family Guardian — server-side checklist progress

## Purpose
The Family Guardian checklist (8 hard-coded items) previously stored its
checked/unchecked state in browser localStorage only, so progress was lost on
a new device or browser. This migration adds a per-user server-side table so
checklist progress syncs across devices, just like contacts, incidents, and
analysis history.

## New Table
### checklist_progress
- id (uuid, PK)
- user_id (uuid, FK -> auth.users, owner, DEFAULT auth.uid())
- item_index (integer, NOT NULL, 0–7) — which checklist item (0-indexed)
- checked (boolean, NOT NULL, default false) — whether the item is done
- updated_at (timestamptz, default now())
- UNIQUE (user_id, item_index) — one row per checklist item per user

## Security — Row Level Security
RLS ENABLED with four owner-scoped policies (SELECT, INSERT, UPDATE, DELETE),
each restricted TO authenticated and scoped by auth.uid() = user_id. No anon
access. Owner column defaults to auth.uid() so inserts that omit user_id
succeed.

## Notes
- The checklist items themselves are defined in the frontend (FAMILY_CHECKLIST).
  This table only stores the boolean state for each item index (0–7).
- item_index is constrained to 0–7 via a CHECK constraint to match the 8-item
  checklist. If the checklist grows, update the constraint.
- A row-count guard is unnecessary — the table is capped at 8 rows per user
  by the unique constraint.
*/

CREATE TABLE IF NOT EXISTS checklist_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  item_index integer NOT NULL CHECK (item_index BETWEEN 0 AND 7),
  checked boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_index)
);

ALTER TABLE checklist_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_checklist" ON checklist_progress;
CREATE POLICY "select_own_checklist" ON checklist_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_checklist" ON checklist_progress;
CREATE POLICY "insert_own_checklist" ON checklist_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_checklist" ON checklist_progress;
CREATE POLICY "update_own_checklist" ON checklist_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_checklist" ON checklist_progress;
CREATE POLICY "delete_own_checklist" ON checklist_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
