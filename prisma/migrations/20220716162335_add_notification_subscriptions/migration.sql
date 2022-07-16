-- CreateTable
CREATE TABLE "notification_types" (
    "id" UUID NOT NULL,
    "human_readable_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT,
    "ordering_priority" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "dapp_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_subscriptions" (
    "id" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "notification_type_id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_types_dapp_id_human_readable_id_key" ON "notification_types"("dapp_id", "human_readable_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_types_dapp_id_id_key" ON "notification_types"("dapp_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_subscriptions_wallet_id_notification_type_id_key" ON "notification_subscriptions"("wallet_id", "notification_type_id");

-- AddForeignKey
ALTER TABLE "notification_types" ADD CONSTRAINT "notification_types_dapp_id_fkey" FOREIGN KEY ("dapp_id") REFERENCES "dapps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_subscriptions" ADD CONSTRAINT "notification_subscriptions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_subscriptions" ADD CONSTRAINT "notification_subscriptions_notification_type_id_fkey" FOREIGN KEY ("notification_type_id") REFERENCES "notification_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
