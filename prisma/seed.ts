import { PrismaClient } from '@prisma/client';

async function seedDev() {
  const prisma = new PrismaClient();
  const wallet = await prisma.wallet.upsert({
    where: {
      publicKey: '92esmqcgpA7CRCYtefHw2J6h7kQHi8q7pP3QmeTCQp8q',
    },
    create: {
      id: '44a34c33-9938-49f3-935c-dcbf35d1b5a1',
      publicKey: '92esmqcgpA7CRCYtefHw2J6h7kQHi8q7pP3QmeTCQp8q',
    },
    update: {},
  });
  const address = await prisma.address.upsert({
    where: {
      id: '44a34c33-9938-49f3-935c-dcbf35d1b5a2',
    },
    create: {
      id: '44a34c33-9938-49f3-935c-dcbf35d1b5a2',
      type: 'email',
      value: 'hello@dialect.to',
      verified: true,
      walletId: wallet.id, // TODO: Set wallet instead
    },
    update: {},
  });
  const dialect = await prisma.dapp.upsert({
    where: {
      id: '44a34c33-9938-49f3-935c-dcbf35d1b5a3',
    },
    create: {
      id: '44a34c33-9938-49f3-935c-dcbf35d1b5a3',
      name: 'dialect',
      publicKey: 'D1ALECTfeCZt9bAbPWtJk7ntv24vDYGPmyS7swp7DY5h',
    },
    update: {},
  });

  await prisma.notificationType.upsert({
    where: {
      dappId_id: {
        dappId: dialect.id,
        id: 'd388f444-fa34-4e4d-a306-a1958a50640d',
      },
    },
    create: {
      id: 'd388f444-fa34-4e4d-a306-a1958a50640d',
      dappId: dialect.id,
      name: 'Dapp notification type 1',
      trigger: 'Dapp notification type trigger 1',
      humanReadableId: 'notification_1',
      enabled: true,
      tags: [],
    },
    update: {},
  });

  await prisma.notificationType.upsert({
    where: {
      dappId_id: {
        dappId: dialect.id,
        id: 'b63184eb-e25f-408f-aca3-d5961dbc2edc',
      },
    },
    create: {
      id: 'b63184eb-e25f-408f-aca3-d5961dbc2edc',
      dappId: dialect.id,
      name: 'Dapp notification type 2',
      trigger: 'Dapp notification type trigger 2',
      humanReadableId: 'notification_2',
      enabled: false,
      tags: [],
    },
    update: {},
  });

  const dialectDevnet = await prisma.dapp.upsert({
    where: {
      id: 'e191eb46-3fa2-483f-abb7-24645b634666',
    },
    create: {
      id: 'e191eb46-3fa2-483f-abb7-24645b634666',
      name: 'dialect-devnet',
      publicKey: 'D2pyBevYb6dit1oCx6e8vCxFK9mBeYCRe8TTntk2Tm98',
    },
    update: {},
  });
  await prisma.dappAddress.upsert({
    where: {
      id: '44a34c33-9938-49f3-935c-dcbf35d1b5a4',
    },
    create: {
      id: '44a34c33-9938-49f3-935c-dcbf35d1b5a4',
      dappId: dialectDevnet.id,
      addressId: address.id,
      enabled: true,
    },
    update: {},
  });

  // at
  const atWallet = await prisma.wallet.upsert({
    where: {
      publicKey: '6MKeaLnTnhXM6Qo8gHEgbeqeoUqbg4Re4FL5UHXMjetJ',
    },
    create: {
      publicKey: '6MKeaLnTnhXM6Qo8gHEgbeqeoUqbg4Re4FL5UHXMjetJ',
    },
    update: {},
  });
  const atDapp = await prisma.dapp.upsert({
    where: {
      publicKey: '5SVmPJUGtthMZNB77NggkanUd9f1NkLzeaDbabWFmdjV',
    },
    create: {
      name: 'at-dapp',
      publicKey: '5SVmPJUGtthMZNB77NggkanUd9f1NkLzeaDbabWFmdjV',
    },
    update: {},
  });

  await prisma.notificationType.upsert({
    where: {
      dappId_id: {
        dappId: atDapp.id,
        id: '987b5120-be02-40a6-b50c-951575a1118e',
      },
    },
    create: {
      dappId: atDapp.id,
      id: '987b5120-be02-40a6-b50c-951575a1118e',
      name: 'at dapp test notification type',
      humanReadableId: 'at-dapp-test-notification',
    },
    update: {},
  });

  await prisma.notificationType.upsert({
    where: {
      dappId_id: {
        dappId: atDapp.id,
        id: '887b5120-be02-40a6-b50c-951575a1118e',
      },
    },
    create: {
      dappId: atDapp.id,
      id: '887b5120-be02-40a6-b50c-951575a1118e',
      name: 'at dapp test notification type 2',
      humanReadableId: 'at-dapp-test-notification 2',
    },
    update: {},
  });

  return;
}

async function main() {
  const env = process.env.ENVIRONMENT;
  if (env === 'dev' || env === 'dev-local') {
    await seedDev();
  } else {
    console.log(`${env} cannot be seeded`);
  }
}

main();
