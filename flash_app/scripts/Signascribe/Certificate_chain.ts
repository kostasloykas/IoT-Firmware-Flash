import { Buffer } from "buffer";
import { assert } from "../classes";

export class CertificateChain {
  private bytes: Buffer = null;
  private owner_certificate: any = null;
  private intermediate_certificates: any = null;
  private common_name: string = null;

  // FIXME: contructor Certificate Chain
  constructor(bytes: Buffer) {
    this.bytes = bytes;

    // load certificates
    this.LoadCertificates(bytes);

    // init owner certificate and intermediate

    // init common name
    assert(this.owner_certificate != null, "");
    assert(this.intermediate_certificates != null, "");
    assert(this.common_name != null, "");
  }

  // FIXME: LoadCertificates
  private LoadCertificates(bytes: Buffer): any {
    return null;
  }

  // FIXME: Verify Certificate
  public async Verify() {}

  public get Bytes(): Buffer {
    return this.bytes;
  }
}
