import crypto from "js-sha256";
import { ICryptoProvider } from "queueit-knownuser";

export class FastlyCryptoProvider implements ICryptoProvider {
  public constructor() {}
  public getSha256Hash(secretKey: string, stringToHash: string) {
    return crypto.sha256.hmac(secretKey, stringToHash);
  }
}
