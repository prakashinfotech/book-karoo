-- Migration 011: Fix GST rate to 18% (stored as decimal 0.18)
-- Run in Supabase SQL Editor

UPDATE "Settings"
SET    "Value"     = '0.18',
       "UpdatedAt" = now()
WHERE  "Key" = 'gst_rate';

-- Verify (should show 0.18)
SELECT "Key", "Value" FROM "Settings" WHERE "Key" IN ('gst_rate', 'convenience_fee_per_ticket');
