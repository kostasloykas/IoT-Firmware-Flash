import AdmZip from "adm-zip";
import { PRINT, FirmwareFile, NRFZIP, ERROR } from "../classes";
import { ManifestJSON } from "./ManifestJSON";
import { CertificateChain } from "./Certificate_chain";

// FIXME: TilergatisZip
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
          ERROR("Uknown file in Tilergatis Zip file");
          break;
      }
    });
    PRINT("Tilergatis Zip Decoded");
  }

  //FIXME: VerifySignature
  private VerifySignature() {}

  //FIXME: VerifyCertificateChain
  private VerifyCertificateChain() {}

  //FIXME: VerifySignatureAndCertificateChain
  public VerifySignatureAndCertificateChain() {
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
