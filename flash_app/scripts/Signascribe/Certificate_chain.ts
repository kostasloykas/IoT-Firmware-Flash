import { Buffer } from "buffer";
import { DEBUG, ERROR, assert } from "../classes";
import * as https from "https";
import axios from "axios";

export class CertificateChain {
  private bytes: Buffer = null;
  private owner_certificate: any = null;
  private intermediate_certificates: any = null;
  private common_name: string = null;
  private trusted_CA: string = null;

  // FIXME: contructor Certificate Chain
  constructor(bytes: Buffer) {
    this.bytes = bytes;

    // init owner certificate and intermediate

    // init common name

    // FIXME: assertions
    // assert(this.owner_certificate != null, "");
    // assert(this.intermediate_certificates != null, "");
    // assert(this.common_name != null, "");
  }

  private DistinguishCertificates(file: string): any {
    return null;
  }

  // FIXME: Load CA's certificate list
  private async LoadListOfTrustedCaCertificates(): Promise<string> {
    // load mozilla's trusted certificates list
    await axios
      .get("https://corsproxy.io/?https://curl.se/ca/cacert.pem")
      .then((response) => {
        const responseData = response.data;
        DEBUG(responseData);
      })
      .catch((err) => {
        ERROR(`Error fetching data:`, err);
      });

    // make them all x509 objects
    return null;
  }

  // FIXME: GetOwnerCertificate
  private GetOwnerCertificate(bytes: Buffer): any {
    return null;
  }

  // FIXME: GetIntermediateCertificates
  private GetIntermediateCertificates(bytes: Buffer): any {
    return null;
  }

  // FIXME: Verify Certificate
  public async Verify() {
    // load certificates
    await this.LoadListOfTrustedCaCertificates();
  }

  public get Bytes(): Buffer {
    return this.bytes;
  }
}
