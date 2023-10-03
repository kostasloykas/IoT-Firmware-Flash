import { Signature } from "./Signature";
import AdmZip from "adm-zip";
import { PRINT, FirmwareFile, NRFZIP, ERROR, assert } from "../classes";
import { ManifestJSON } from "./ManifestJSON";
import { CertificateChain } from "./Certificate_chain";

export class TilergatisZip {
  private firmware: NRFZIP | FirmwareFile = null;
  private firmware_bytes: Buffer = null; // needs for signature verification
  private manifest_json: ManifestJSON = null;
  private signature: Signature = null;
  private certificate_chain: CertificateChain = null;

  public constructor(zip_file: AdmZip) {
    // Concrete it file from zip
    zip_file.forEach((entry) => {
      // Take name and bytes of file
      let name: string = entry.entryName;
      let bytes: Buffer = entry.getCompressedData();

      switch (name) {
        case "firmware.hex":
          // hex file
          this.firmware = new FirmwareFile(bytes, "Uint8Array");
          this.firmware_bytes = bytes;
          break;

        case "firmware.zip":
          // NRF zip file
          this.firmware = new NRFZIP(bytes);
          this.firmware_bytes = bytes;
          break;

        case "tilergatis_manifest.json":
          this.manifest_json = new ManifestJSON(bytes);
          break;

        case "certificate_chain.pem":
          this.certificate_chain = new CertificateChain(bytes);
          break;

        case "signature.dat":
          this.signature = new Signature(bytes);
          break;

        default:
          ERROR("Unknown file in Tilergatis Zip file");
          break;
      }
    });

    assert(this.firmware != null, "Tilergatis Zip firmware must be != null");
    assert(this.manifest_json != null, "Tilergatis Zip manifest json must be != null");
    assert(this.signature != null, "Tilergatis Zip signature must be != null");
    assert(this.certificate_chain != null, "Tilergatis Zip certificate chain must be != null");

    PRINT("Tilergatis Zip Imported Successfully");
  }

  // VerifySignature
  private async VerifySignature() {
    await this.signature
      .Verify(
        this.manifest_json.SignAlgorithmType,
        this.manifest_json.HashAlgorithm,
        this.manifest_json.Bytes,
        this.certificate_chain.Bytes,
        this.firmware_bytes,
        this.manifest_json.SignAlgorithmPublicKey
      )
      .catch((err) => {
        ERROR("VerifySignature", err);
      });
  }

  //FIXME: VerifyCertificateChain
  private async VerifyCertificateChain() {}

  // VerifySignatureAndCertificateChain
  public async VerifySignatureAndCertificateChain() {
    PRINT("Trying to verify signature");
    await this.VerifySignature()
      .then(() => {
        PRINT("Signature verified");
      })
      .catch((err) => {
        ERROR("VerifySignatureAndCertificateChain", err);
      });

    PRINT("Trying to verify certificate chain");
    this.VerifyCertificateChain();
    PRINT("Certificate chain verified");
    return;
  }

  public get Firmware(): NRFZIP | FirmwareFile {
    return this.firmware;
  }
  public get Signature(): NRFZIP | FirmwareFile {
    return this.firmware;
  }
  public get CertificateChain(): NRFZIP | FirmwareFile {
    return this.firmware;
  }
  public get ManifestJson(): NRFZIP | FirmwareFile {
    return this.firmware;
  }
}
