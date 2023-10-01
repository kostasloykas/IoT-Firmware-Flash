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

  // FIXME: Signature Verify
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

    // generate hash (depends on hash algorithm)
    let hash = await this.HASH.get(hash_algorithm)(message);

    DEBUG(this.bytes.toString("hex"));
    // verify signature
    let verified: boolean = this.SIGN.get(sign_algorithm).verify(
      this.bytes.toString("hex"),
      hash,
      public_key //FIXME: public_key
    );
    if (!verified) ERROR("Couldn't Verify Signature");

    // Convert PEM to Buffer
    // const publicKeyBuffer = Crypto.createPublicKey({
    //   key: public_key,
    //   format: "pem",
    //   type: "spki",
    // }).export({ type: "spki", format: "der" });

    // const kos = crypto.createPublicKey({
    //   key: public_key,
    //   format: "pem",
    //   type: "spki",
    // }).type;
  }

  public get Bytes(): Buffer {
    return this.bytes;
  }
}
