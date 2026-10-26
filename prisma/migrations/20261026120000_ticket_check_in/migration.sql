-- Random per-booking code for the public QR URL: the sequential reference is
-- guessable. Existing rows are backfilled before the column goes NOT NULL.
ALTER TABLE "bookings" ADD COLUMN "verificationCode" TEXT;
UPDATE "bookings"
SET "verificationCode" = gen_random_uuid()::text
WHERE "verificationCode" IS NULL;
ALTER TABLE "bookings" ALTER COLUMN "verificationCode" SET NOT NULL;
CREATE UNIQUE INDEX "bookings_verificationCode_key" ON "bookings"("verificationCode");

ALTER TABLE "bookings" ADD COLUMN "checkedInAt" TIMESTAMP(3);
