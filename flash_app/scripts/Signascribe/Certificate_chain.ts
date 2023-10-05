import { Buffer } from "buffer";
import { DEBUG, ERROR, assert } from "../classes";
import axios from "axios";
import { pki as x509 } from "node-forge";

export class CertificateChain {
  private bytes: Buffer = null;
  private owner_certificate: any = null;
  private intermediate_certificates: any = null;
  private common_name: string = null;
  private trusted_CA: string = null;

  // FIXME: contructor Certificate Chain
  constructor(bytes: Buffer) {
    this.bytes = bytes;

    // get owner certificate

    // get intermediate certificates

    // get common name

    // FIXME: assertions
    // assert(this.owner_certificate != null, "");
    // assert(this.intermediate_certificates != null, "");
    // assert(this.common_name != null, "");
  }

  private DistinguishCertificates(file: string): any {
    return null;
  }

  // Load CA's certificate list
  private async LoadListOfTrustedCaCertificates(): Promise<string[]> {
    // load mozilla's trusted certificates list
    let mozillas_certificates: string = null;

    await axios
      .get("https://corsproxy.io/?https://curl.se/ca/cacert.pem")
      .then((response) => {
        mozillas_certificates = response.data;
      })
      .catch((err) => {
        ERROR(`Error fetching data:`, err);
      });

    let certificates: string[] = this.SeparateX509Certificates(mozillas_certificates);

    assert(mozillas_certificates != null, "Mozilla's certificates must be != null");
    return certificates;
  }

  private SeparateX509Certificates(pemString: string): string[] {
    const certificates: string[] = [];
    const regex = /-----BEGIN CERTIFICATE-----[^-]*-----END CERTIFICATE-----/g;
    let match;

    while ((match = regex.exec(pemString)) !== null) {
      certificates.push(match[0]);
    }
    return certificates;
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
    // load trusted certificates
    let ca_store: x509.CAStore = null;

    await this.LoadListOfTrustedCaCertificates()
      .then((mozilla_certificates) => {
        ca_store = x509.createCaStore();

        // some certificates can't include in the ca store
        // i don't know why :)
        for (let cert of mozilla_certificates) {
          try {
            ca_store.addCertificate(cert);
          } catch (error) {}
        }
      })
      .catch((err) => {
        ERROR("LoadListOfTrustedCaCertificates", err);
      });

    assert(ca_store != null, "CA Store must be != null");

    for (let cert of ca_store.listAllCertificates()) {
      this.common_name = cert.issuer.attributes[1].value as string;
    }
  }

  public get Bytes(): Buffer {
    return this.bytes;
  }
}
