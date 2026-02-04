-- Remove totalAmount field from Invoice table
ALTER TABLE "Invoice" DROP COLUMN IF EXISTS "totalAmount";
