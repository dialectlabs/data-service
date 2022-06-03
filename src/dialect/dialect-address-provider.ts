import { PublicKey } from '@solana/web3.js';
import { getDialectProgramAddress, programs } from '@dialectlabs/web3';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const SOLANA_NETWORK_NAME: 'localnet' | 'devnet' | 'mainnet' =
  process.env.SOLANA_NETWORK_NAME;

if (!SOLANA_NETWORK_NAME) {
  throw new Error(
    'SOLANA_NETWORK_NAME env variable is not defined, please define it.',
  );
}

export class DialectAddressProvider {
  static async getAddress(memberPublicKeys: PublicKey[]) {
    const programAddress = new PublicKey(
      programs[SOLANA_NETWORK_NAME].programAddress,
    );
    return getDialectProgramAddress(programAddress, memberPublicKeys).then(
      (it) => it[0],
    );
  }
}
