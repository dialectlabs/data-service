/*
  Warnings:

  - The `metadata` column on the `dapp_addresses` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "dapp_addresses" DROP COLUMN "metadata",
ADD COLUMN     "metadata" JSONB;
