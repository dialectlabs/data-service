-- AlterTable
ALTER TABLE "dapps" ADD COLUMN     "description" TEXT,
ADD COLUMN     "logo_image_url" TEXT,
ADD COLUMN     "name" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;
