import { Duration } from 'luxon';
import {
  NodeDialectWalletAdapter,
  DialectWalletAdapterWrapper,
  DialectWalletAdapterSolanaTxTokenSigner,
  Auth,
} from '@dialectlabs/sdk';

const wallet = DialectWalletAdapterWrapper.create(
  NodeDialectWalletAdapter.create(),
);

(async () => {
  const token = await Auth.tokens.generate(
    new DialectWalletAdapterSolanaTxTokenSigner(wallet),
    Duration.fromObject({ minutes: 120 }),
  );
  console.log(JSON.stringify(token, null, 2));
  console.log(token.body.sub);
})();
