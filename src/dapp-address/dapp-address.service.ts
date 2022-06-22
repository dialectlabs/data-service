import { DappAddress, Prisma } from '@prisma/client';

export function extractTelegramChatId(
  dappAddress: DappAddress,
): string | undefined {
  if (!dappAddress.metadata) {
    return;
  }
  const metadata = dappAddress.metadata as Prisma.JsonObject;
  if (metadata.telegram_chat_id) {
    return metadata.telegram_chat_id as string;
  }
}
