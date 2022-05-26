import { Duration } from 'luxon';
import { EmbeddedWalletAdapter, Token } from '@dialectlabs/sdk';

const wallet = EmbeddedWalletAdapter.create();

(async () => {
  const token = await Token.generate(
    wallet,
    Duration.fromObject({ minutes: 120 }),
  );
  console.log(token.rawValue);
  console.log(token.body.sub);
})();
