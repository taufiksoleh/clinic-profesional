import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_bookings_notification_status" ADD VALUE 'sending' BEFORE 'sent';
  ALTER TYPE "public"."enum_bookings_notification_status" ADD VALUE 'uncertain';
  ALTER TYPE "public"."enum_bookings_meta_status" ADD VALUE 'sending' BEFORE 'sent';
  ALTER TYPE "public"."enum_bookings_meta_status" ADD VALUE 'uncertain';
  ALTER TABLE "bookings" ADD COLUMN "email_delivery_attempts" numeric DEFAULT 0;
  ALTER TABLE "bookings" ADD COLUMN "email_delivery_last_attempt_at" timestamp(3) with time zone;
  ALTER TABLE "bookings" ADD COLUMN "email_delivery_next_attempt_at" timestamp(3) with time zone;
  ALTER TABLE "bookings" ADD COLUMN "email_delivery_last_error" varchar;
  ALTER TABLE "bookings" ADD COLUMN "meta_delivery_attempts" numeric DEFAULT 0;
  ALTER TABLE "bookings" ADD COLUMN "meta_delivery_last_attempt_at" timestamp(3) with time zone;
  ALTER TABLE "bookings" ADD COLUMN "meta_delivery_next_attempt_at" timestamp(3) with time zone;
  ALTER TABLE "bookings" ADD COLUMN "meta_delivery_last_error" varchar;
  ALTER TABLE "bookings" ADD COLUMN "retry_email" boolean;
  ALTER TABLE "bookings" ADD COLUMN "retry_meta" boolean;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    IF EXISTS (
      SELECT 1 FROM "bookings"
      WHERE "notification_status"::text IN ('sending', 'uncertain')
         OR "meta_status"::text IN ('sending', 'uncertain')
    ) THEN
      RAISE EXCEPTION 'Resolve sending and uncertain notifications before rollback; their delivery outcome cannot be safely inferred.';
    END IF;
  END $$;
  ALTER TABLE "bookings" ALTER COLUMN "notification_status" SET DATA TYPE text;
  ALTER TABLE "bookings" ALTER COLUMN "notification_status" SET DEFAULT 'pending'::text;
  DROP TYPE "public"."enum_bookings_notification_status";
  CREATE TYPE "public"."enum_bookings_notification_status" AS ENUM('pending', 'sent', 'disabled', 'failed');
  ALTER TABLE "bookings" ALTER COLUMN "notification_status" SET DEFAULT 'pending'::"public"."enum_bookings_notification_status";
  ALTER TABLE "bookings" ALTER COLUMN "notification_status" SET DATA TYPE "public"."enum_bookings_notification_status" USING "notification_status"::"public"."enum_bookings_notification_status";
  ALTER TABLE "bookings" ALTER COLUMN "meta_status" SET DATA TYPE text;
  ALTER TABLE "bookings" ALTER COLUMN "meta_status" SET DEFAULT 'pending'::text;
  DROP TYPE "public"."enum_bookings_meta_status";
  CREATE TYPE "public"."enum_bookings_meta_status" AS ENUM('pending', 'sent', 'disabled', 'failed');
  ALTER TABLE "bookings" ALTER COLUMN "meta_status" SET DEFAULT 'pending'::"public"."enum_bookings_meta_status";
  ALTER TABLE "bookings" ALTER COLUMN "meta_status" SET DATA TYPE "public"."enum_bookings_meta_status" USING "meta_status"::"public"."enum_bookings_meta_status";
  ALTER TABLE "bookings" DROP COLUMN "email_delivery_attempts";
  ALTER TABLE "bookings" DROP COLUMN "email_delivery_last_attempt_at";
  ALTER TABLE "bookings" DROP COLUMN "email_delivery_next_attempt_at";
  ALTER TABLE "bookings" DROP COLUMN "email_delivery_last_error";
  ALTER TABLE "bookings" DROP COLUMN "meta_delivery_attempts";
  ALTER TABLE "bookings" DROP COLUMN "meta_delivery_last_attempt_at";
  ALTER TABLE "bookings" DROP COLUMN "meta_delivery_next_attempt_at";
  ALTER TABLE "bookings" DROP COLUMN "meta_delivery_last_error";
  ALTER TABLE "bookings" DROP COLUMN "retry_email";
  ALTER TABLE "bookings" DROP COLUMN "retry_meta";`)
}
