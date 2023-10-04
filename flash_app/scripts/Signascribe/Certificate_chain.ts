import { Buffer } from "buffer";
import { DEBUG, ERROR, assert } from "../classes";
import * as https from "https";

export class CertificateChain {
  private bytes: Buffer = null;
  private owner_certificate: any = null;
  private intermediate_certificates: any = null;
  private common_name: string = null;
  private trusted_CA: string = null;

  // FIXME: contructor Certificate Chain
  constructor(bytes: Buffer) {
    this.bytes = bytes;

    // load certificates
    this.trusted_CA = this.LoadListOfTrustedCaCertificates();
    DEBUG(bytes.toString("utf-8"));

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
  private LoadListOfTrustedCaCertificates(): any {
    // load mozilla's trusted certificates list
    https
      .get("/index.html", (response) => {
        let responseData: string = "";

        response.on("data", (chunk) => {
          responseData += chunk;
        });

        response.on("end", () => {
          DEBUG("response data are ", responseData);
        });
      })
      .on("error", (err) => {
        ERROR("Error downloading trusted CA certificates file", err);
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
  public async Verify() {}

  public get Bytes(): Buffer {
    return this.bytes;
  }
}
