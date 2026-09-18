-- One-time repair: sync access_codes.used / used_at / email / order_id from existing orders
-- when the post-checkout update failed (e.g. missing email column). Safe to re-run; uses COALESCE.
-- Requires 17-add-email-to-access-codes.sql (email column) applied first.

UPDATE ra_cadet_access_codes c
SET
  used = true,
  used_at = COALESCE(c.used_at, o.created_at),
  email = COALESCE(c.email, o.email),
  order_id = COALESCE(c.order_id, o.id)
FROM ra_cadet_orders o
WHERE UPPER(TRIM(o.code)) = UPPER(TRIM(c.code))
  AND (c.used IS NOT TRUE OR c.order_id IS NULL OR c.email IS NULL);
