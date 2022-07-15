/*
  Warnings:

  - A unique constraint covering the columns `[dapp_id,id]` on the table `notification_types` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "notification_types_dapp_id_id_key" ON "notification_types"("dapp_id", "id");
