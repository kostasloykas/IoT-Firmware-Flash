import { Buffer } from "buffer";
import { DEBUG, ERROR, PRINT, assert } from "../classes";
import axios from "axios";
import { pki as x509 } from "node-forge";

// FIXME: Add codegic certificates
export class CertificateChain {
  private bytes: Buffer = null;
  private owner_certificate: x509.Certificate = null;
  private intermediate_certificates: x509.Certificate[] = [];
  private common_name: string = null;

  // contructor Certificate Chain
  constructor(bytes: Buffer) {
    this.bytes = bytes;
    let certificates: string[] = this.SeparateX509Certificates(bytes.toString("utf-8"));

    // get owner certificate
    this.owner_certificate = this.GetOwnerCertificate(certificates);

    // get intermediate certificates
    this.intermediate_certificates = this.GetIntermediateCertificates(certificates);

    // // get common name
    this.common_name = this.owner_certificate.subject.attributes[0].value as string;

    assert(this.owner_certificate != null, "Owner certificate must be != null");
    assert(this.common_name != null, "Common name must be != null");
  }

  private Certificates(file: string): any {
    return null;
  }

  // Load CA's certificate list
  private async LoadListOfTrustedCaCertificates(): Promise<string[]> {
    // load mozilla's trusted certificates list
    let mozillas_certificates: string = null;
    let local_certificates: string = null;

    await axios
      .get("https://corsproxy.io/?https://curl.se/ca/cacert.pem")
      .then((response) => {
        mozillas_certificates = response.data;
      })
      .catch((err) => {
        ERROR(`Error fetching mozillas data:`, err);
      });

    await axios
      .get("/certificates/local_certificates.pem")
      .then((response) => {
        local_certificates = response.data;
        DEBUG(local_certificates);
      })
      .catch((err) => {
        ERROR(`Error  fetching local certificates data:`, err);
      });

    let imported_certificates = mozillas_certificates + local_certificates;
    let certificates: string[] = this.SeparateX509Certificates(imported_certificates);

    assert(mozillas_certificates != null, "Mozilla's certificates must be != null");
    assert(local_certificates != null, "Local certificates must be != null");
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
  private GetOwnerCertificate(certificates: string[]): x509.Certificate {
    return x509.certificateFromPem(certificates[0]);
  }

  // GetIntermediateCertificates
  private GetIntermediateCertificates(certificates: string[]): x509.Certificate[] {
    let inter_certificates: x509.Certificate[] = [];
    for (let cert of certificates.slice(1)) {
      inter_certificates.push(x509.certificateFromPem(cert));
    }
    return inter_certificates;
  }

  // Verify Certificate
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
    DEBUG(ca_store.listAllCertificates().length);

    // verify intermediate certificates
    this.VerifyIntermediateCertificates(this.intermediate_certificates, ca_store);

    // add intermediate certificates to CA store
    this.AddCertificatesToCAStore(this.intermediate_certificates, ca_store);

    // verify owner certificate
    this.VerifyOwnerCertificate(this.owner_certificate, ca_store);
  }

  private AddCertificatesToCAStore(certificates: x509.Certificate[], ca_store: x509.CAStore) {
    for (let cert of certificates) ca_store.addCertificate(cert);
  }

  private VerifyIntermediateCertificates(
    intermediate_certificates: x509.Certificate[],
    ca_store: x509.CAStore
  ) {
    if (intermediate_certificates.length != 0)
      try {
        x509.verifyCertificateChain(ca_store, this.intermediate_certificates);
      } catch (err) {
        ERROR("Couldn't validate intermediate certificate chain");
      }
  }

  private VerifyOwnerCertificate(owner_certificate: x509.Certificate, ca_store: x509.CAStore) {
    try {
      x509.verifyCertificateChain(ca_store, [owner_certificate]);
    } catch (err) {
      ERROR("Couldn't validate owner certificate");
    }
  }

  public get Bytes(): Buffer {
    return this.bytes;
  }
}
