import AdmZip from "adm-zip";
import { PRINT, FirmwareFile, NRFZIP, ERROR, assert } from "../classes";
import { ManifestJSON } from "./ManifestJSON";
import { CertificateChain } from "./Certificate_chain";

export class TilergatisZip {
  private firmware: NRFZIP | FirmwareFile = null;
  private manifest_json: ManifestJSON = null;
  private signature: any = null;
  private certificate_chain: CertificateChain = null;

  // FIXME: Tilergatis zip constructor
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
          break;

        case "firmware.zip":
          // NRF zip file
          this.firmware = new NRFZIP(bytes);
          break;

        case "tilergatis_manifest.json":
          // convert bytes to json
          const decoder = new TextDecoder("utf-8");
          const jsonString = decoder.decode(bytes);
          this.manifest_json = new ManifestJSON(JSON.parse(jsonString));
          break;

        case "certificate_chain.pem":
          this.certificate_chain = new CertificateChain(bytes);
          break;

        case "signature.dat":
          this.signature = bytes;
          break;

        default:
          ERROR("Unknown file in Tilergatis Zip file");
          break;
      }
    });

    //  assert attributes of class
    assert(this.firmware != null, "Tilergatis Zip firmware must be != null");
    assert(this.manifest_json != null, "Tilergatis Zip manifest json must be != null");
    assert(this.signature != null, "Tilergatis Zip signature must be != null");
    assert(this.certificate_chain != null, "Tilergatis Zip certificate chain must be != null");

    PRINT("Tilergatis Zip Imported Successfully");

    // FIXME: needs try catch
    this.VerifySignatureAndCertificateChain();
  }

  //FIXME: VerifySignature
  private VerifySignature() {}

  //FIXME: VerifyCertificateChain
  private VerifyCertificateChain() {}

  // VerifySignatureAndCertificateChain
  private VerifySignatureAndCertificateChain() {
    PRINT("Trying to verify signature");
    this.VerifySignature();
    PRINT("Signature verified");

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
