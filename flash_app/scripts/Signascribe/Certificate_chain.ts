import { Buffer } from "buffer";

export class CertificateChain {
  private bytes: Buffer = null;
  private certificates: [any] = null;
  private owner_certificate: any = null;
  private intermediate_certificates: any = null;
  private common_name: string = null;

  constructor(bytes: Buffer) {
    this.bytes = bytes;

    // load certificates and import them in the list of certificates
  }

  // FIXME: LoadCertificates
  private LoadCertificates() {}

  // FIXME: Verify Certificate
  public async Verify() {}

  public get Bytes(): Buffer {
    return this.bytes;
  }
}
