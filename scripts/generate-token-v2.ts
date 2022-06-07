import { Duration } from 'luxon';
import {
  NodeDialectWalletAdapter,
  DialectWalletAdapterWrapper,
  DialectWalletAdapterEd25519TokenSigner,
  Auth,
} from '@dialectlabs/sdk';

const wallet = DialectWalletAdapterWrapper.create(
  NodeDialectWalletAdapter.create(),
);

(async () => {
  const token = await Auth.tokens.generate(
    new DialectWalletAdapterEd25519TokenSigner(wallet),
    Duration.fromObject({ minutes: 120 }),
  );
  console.log(token.rawValue);
  console.log(token.body.sub);
})();
