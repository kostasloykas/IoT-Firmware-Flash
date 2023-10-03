import { Buffer } from "buffer";
import { DEBUG, ERROR } from "../classes";
import { sha256 } from "crypto-hash";
import { ed448 } from "@noble/curves/ed448";
import { ed25519 } from "@noble/curves/ed25519";

export class Signature {
  private SUPPORTED_HASH_ALGORITHM = ["sha256"];
  private SUPPORTED_SIGN_ALGORITHM = ["eddsa448", "eddsa25519"];
  private bytes: Buffer = null;
  private HASH = new Map<string, any>([["sha256", sha256]]);
  private SIGN = new Map<string, typeof ed25519 | typeof ed448>([
    ["eddsa448", ed448],
    ["eddsa25519", ed25519],
  ]);

  constructor(bytes: Buffer) {
    this.bytes = bytes;
  }

  // Signature Verify
  public async Verify(
    sign_algorithm: string,
    hash_algorithm: string,
    manifest_json: Buffer,
    certificate_chain: Buffer,
    firmware: Buffer,
    public_key: string
  ) {
    DEBUG(sign_algorithm);
    if (!this.SUPPORTED_SIGN_ALGORITHM.includes(sign_algorithm)) ERROR("Unsupported sign algorithm");
    if (!this.SUPPORTED_HASH_ALGORITHM.includes(hash_algorithm)) ERROR("Unsupported hash algorithm");

    let message = Buffer.concat([firmware, manifest_json, certificate_chain]);

    // calculate hash , signature , public_key
    let hash = await this.HASH.get(hash_algorithm)(message);
    let signature: string = this.bytes.toString();

    DEBUG("hash->", hash);
    DEBUG("signature->", signature);
    DEBUG("public key->", public_key);
    let verified: boolean = this.SIGN.get(sign_algorithm).verify(signature, hash, public_key);
    if (!verified) ERROR("Couldn't Verify Signature");
  }

  public get Bytes(): Buffer {
    return this.bytes;
  }
}
