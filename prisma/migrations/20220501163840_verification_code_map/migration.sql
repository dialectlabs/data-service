/*
  Warnings:

  - You are about to drop the column `verificationCode` on the `addresses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "addresses" DROP COLUMN "verificationCode",
ADD COLUMN     "verification_code" TEXT;
