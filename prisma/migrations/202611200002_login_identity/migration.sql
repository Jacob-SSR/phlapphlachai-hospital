-- Preserve existing accounts and passwords. Existing email logins continue to work.
-- Deterministic backfill avoids collisions between users with similar email names.
ALTER TABLE public.hospital_user ADD COLUMN "username" VARCHAR(64);
UPDATE public.hospital_user SET "username" = 'user_' || replace("id", '-', '')
WHERE "username" IS NULL;
ALTER TABLE public.hospital_user ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "hospital_user_username_key" ON public.hospital_user("username");
ALTER TABLE public.hospital_user ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE public.hospital_user ADD CONSTRAINT hospital_user_username_check
CHECK ("username" ~ '^[a-z0-9][a-z0-9._-]{2,63}$');
