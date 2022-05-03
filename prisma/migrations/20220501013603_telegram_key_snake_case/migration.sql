/*
  Warnings:

  - You are about to drop the column `telegramKey` on the `dapps` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "dapps" DROP COLUMN "telegramKey",
ADD COLUMN     "telegram_key" TEXT;
