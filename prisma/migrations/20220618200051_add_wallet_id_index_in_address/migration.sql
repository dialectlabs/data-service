/*
  Warnings:

  - A unique constraint covering the columns `[wallet_id,id]` on the table `addresses` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "addresses_wallet_id_id_key" ON "addresses"("wallet_id", "id");
