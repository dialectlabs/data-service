import { PublicKey } from '@solana/web3.js';
import { getDialectProgramAddress, programs } from '@dialectlabs/web3';

export class DialectAddressProvider {
  static async getAddress(memberPublicKeys: PublicKey[]) {
    const programAddress = new PublicKey(programs['localnet'].programAddress); // TODO: use env var for network name
    return getDialectProgramAddress(programAddress, memberPublicKeys).then(
      (it) => it[0],
    );
  }
}
