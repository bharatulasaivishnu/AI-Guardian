/*
# Fix: Set explicit search_path on enforce_row_limit function

## Purpose
The Supabase security advisor flagged that `enforce_row_limit()` has a mutable
search_path, which is a potential security risk (search_path injection). This
migration recreates the function with an explicit, safe search_path.

## Changes
- Recreate `enforce_row_limit()` with `SET search_path = public, pg_temp`.
- No table or policy changes. No data changes.
*/

CREATE OR REPLACE FUNCTION enforce_row_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
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