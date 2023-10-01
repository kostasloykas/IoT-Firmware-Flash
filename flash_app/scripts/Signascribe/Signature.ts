import { Buffer } from "buffer";
import { ManifestJSON } from "./ManifestJSON";
import { CertificateChain } from "./Certificate_chain";
import { DEBUG, ERROR } from "../classes";
import { sha256 } from "crypto-hash";
import { assert } from "console";

export class Signature {
  private SUPPORTED_HASH_ALGORITHM = ["sha256"];
  private SUPPORTED_SIGN_ALGORITHM = ["eddsa448", "eddsa25519"];
  private bytes: Buffer = null;
  private HASH = new Map<string, any>([["sha256", sha256]]);

  constructor(bytes: Buffer) {
    this.bytes = bytes;
  }

  // FIXME: Signature Verify
  public async Verify(
    sign_algorithm: string,
    hash_algorithm: string,
    manifest_json: Buffer,
    certificate_chain: Buffer,
    firmware: Buffer
  ) {
    DEBUG(sign_algorithm);
    if (!this.SUPPORTED_SIGN_ALGORITHM.includes(sign_algorithm)) ERROR("Unsupported sign algorithm");
    if (!this.SUPPORTED_HASH_ALGORITHM.includes(hash_algorithm)) ERROR("Unsupported hash algorithm");

    let message = Buffer.concat([firmware, manifest_json, certificate_chain]);
    let hash = await this.HASH.get(hash_algorithm)(message);
    DEBUG("hash is ", hash);

    ERROR("skajdh");
    // create hash depends on hash algorithm

    // verify signature
  }

  public get Bytes(): Buffer {
    return this.bytes;
  }
}
