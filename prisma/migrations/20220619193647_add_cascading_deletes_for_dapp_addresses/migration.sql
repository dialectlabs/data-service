-- DropForeignKey
ALTER TABLE "dapp_addresses" DROP CONSTRAINT "dapp_addresses_address_id_fkey";

-- AddForeignKey
ALTER TABLE "dapp_addresses" ADD CONSTRAINT "dapp_addresses_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
