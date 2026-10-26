-- Passenger contact now comes from the booking's account (SPEC 20.8).
ALTER TABLE "booking_seats" ALTER COLUMN "passengerEmail" DROP NOT NULL;
ALTER TABLE "booking_seats" ALTER COLUMN "passengerPhone" DROP NOT NULL;
