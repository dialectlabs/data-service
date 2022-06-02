import { NodeDialectWalletAdapter } from '@dialectlabs/sdk';

(async () => {
  const tokenTTLMinutes = 180;
  const now = new Date().getTime();

  const expirationTime = now + tokenTTLMinutes * 60000;
  const dateEncoded = new TextEncoder().encode(
    btoa(JSON.stringify(expirationTime)),
  );
  const wallet = NodeDialectWalletAdapter.create();

  const signature = await wallet.signMessage(dateEncoded);

  const base64Signature = btoa(
    String.fromCharCode.apply(null, signature as unknown as number[]),
  );

  console.log(`${expirationTime}.${base64Signature}`);
  console.log(wallet.publicKey.toBase58());
})();
