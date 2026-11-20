-- CreateSchema
SET search_path TO public;
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "hospital_content" (
    "id" VARCHAR(36) NOT NULL,
    "kind" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "category" VARCHAR(100) NOT NULL DEFAULT '',
    "externalUrl" TEXT,
    "fiscalYear" INTEGER,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "authorId" VARCHAR(36) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "imageId" VARCHAR(36),
    "fileId" VARCHAR(36),

    CONSTRAINT "hospital_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospital_media" (
    "id" VARCHAR(36) NOT NULL,
    "kind" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedBy" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hospital_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospital_audit_log" (
    "id" VARCHAR(36) NOT NULL,
    "contentId" VARCHAR(36) NOT NULL,
    "actorId" VARCHAR(36) NOT NULL,
    "action" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hospital_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospital_user" (
    "id" VARCHAR(36) NOT NULL,
    "email" VARCHAR(191) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hospital_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospital_session" (
    "id" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "hospital_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospital_login_attempt" (
    "id" VARCHAR(64) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hospital_login_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hospital_content_kind_published_deletedAt_createdAt_idx" ON "hospital_content"("kind", "published", "deletedAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "hospital_media_storageKey_key" ON "hospital_media"("storageKey");

-- CreateIndex
CREATE INDEX "hospital_audit_log_contentId_createdAt_idx" ON "hospital_audit_log"("contentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "hospital_user_email_key" ON "hospital_user"("email");

-- CreateIndex
CREATE INDEX "hospital_session_expiresAt_idx" ON "hospital_session"("expiresAt");

-- CreateIndex
CREATE INDEX "hospital_login_attempt_expiresAt_idx" ON "hospital_login_attempt"("expiresAt");

-- AddForeignKey
ALTER TABLE "hospital_content" ADD CONSTRAINT "hospital_content_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "hospital_media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_content" ADD CONSTRAINT "hospital_content_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "hospital_media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_session" ADD CONSTRAINT "hospital_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "hospital_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Only the server's Prisma connection may read/write these tables.
-- No Supabase Auth or browser Data API policies are used by this application.
ALTER TABLE public.hospital_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_login_attempt ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_audit_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
  REVOKE ALL ON public.hospital_content,public.hospital_media,public.hospital_user,public.hospital_session,public.hospital_login_attempt,public.hospital_audit_log FROM anon;
 END IF;
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
  REVOKE ALL ON public.hospital_content,public.hospital_media,public.hospital_user,public.hospital_session,public.hospital_login_attempt,public.hospital_audit_log FROM authenticated;
 END IF;
END $$;
ALTER TABLE public.hospital_user ADD CONSTRAINT hospital_user_role_check CHECK (role IN ('admin','editor'));
ALTER TABLE public.hospital_content ADD CONSTRAINT hospital_content_kind_check CHECK (kind IN ('news','ita','link'));
