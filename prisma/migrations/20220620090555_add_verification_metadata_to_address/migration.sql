-- AlterTable
ALTER TABLE "addresses" ADD COLUMN     "verification_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verification_code_sent_at" TIMESTAMP(3);
