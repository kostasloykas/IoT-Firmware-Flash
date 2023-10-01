import { Buffer } from "buffer";

export class CertificateChain {
  private bytes: Buffer = null;

  constructor(bytes: Buffer) {
    this.bytes = bytes;
  }

  public get Bytes(): Buffer {
    return this.bytes;
  }
}
