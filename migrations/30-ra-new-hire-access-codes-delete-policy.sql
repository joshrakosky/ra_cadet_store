-- Allow DELETE on access codes (Code Manager trash action).
-- RLS was enabled in 16-add-access-codes-table.sql with SELECT/INSERT/UPDATE only;
-- without this policy, DELETE affects zero rows and the UI falsely reported success.
-- Run in Supabase SQL Editor after 17-add-email-to-access-codes.sql if email column is still missing.

CREATE POLICY "ra_cadet_access_codes are deletable"
  ON ra_cadet_access_codes FOR DELETE
  USING (true);
