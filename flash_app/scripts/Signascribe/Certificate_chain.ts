import { Buffer } from "buffer";
import { DEBUG, ERROR, assert } from "../classes";
import axios from "axios";
import { pki as x509 } from "node-forge";

export class CertificateChain {
  private bytes: Buffer = null;
  private owner_certificate: x509.Certificate = null;
  private intermediate_certificates: x509.Certificate[] = [];
  private common_name: string = null;

  // FIXME: contructor Certificate Chain
  constructor(bytes: Buffer) {
    this.bytes = bytes;
    let certificates: string[] = this.SeparateX509Certificates(bytes.toString("utf-8"));

    DEBUG("length of certificates is ", certificates.length);

    // get owner certificate
    this.owner_certificate = x509.certificateFromPem(this.GetOwnerCertificate(certificates));

    // get intermediate certificates
    for (let cert of this.GetIntermediateCertificates(certificates)) {
      this.intermediate_certificates.push(x509.certificateFromPem(cert));
    }

    // // get common name
    this.common_name = this.owner_certificate.subject.attributes[0].value as string;
    DEBUG(this.common_name);

    assert(this.owner_certificate != null, "Owner certificate must be != null");
    assert(this.intermediate_certificates.length != 0, "Intermediate certificates must be != null");
    assert(this.common_name != null, "Common name must be != null");
  }

  private Certificates(file: string): any {
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

  // GetOwnerCertificate
  private GetOwnerCertificate(certificates: string[]): any {
    return certificates[0];
  }

  // FIXME: GetIntermediateCertificates
  private GetIntermediateCertificates(certificates: string[]): any {
    return certificates.slice(1);
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
