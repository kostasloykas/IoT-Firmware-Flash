import { Signature } from "./Signature";
import AdmZip from "adm-zip";
import { PRINT, FirmwareFile, NRFZIP, ERROR, assert, DEBUG } from "../classes";
import { ManifestJSON } from "./ManifestJSON";
import { CertificateChain } from "./Certificate_chain";
import { Buffer } from "buffer";
import { idText } from "typescript";
import { urlToHttpOptions } from "url";

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
      let bytes: Buffer = entry.getData();

      switch (name) {
        case "firmware.hex":
          // hex file
          this.firmware = new FirmwareFile(FirmwareFile.ConvertToHex(bytes), "Uint8Array");
          this.firmware_bytes = bytes;
          break;

        case "firmware.bin":
          // bin file
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

  // VerifyCertificateChain
  private async VerifyCertificateChain() {
    await this.certificate_chain.Verify().catch((err) => {
      ERROR("VerifyCertificateChain", err);
    });
  }

  // VerifySignatureAndCertificateChain
  public async Verify() {
    PRINT("Trying to verify signature");
    await this.VerifySignature()
      .then(() => {
        PRINT("Signature verified");
      })
      .catch((err) => {
        ERROR("VerifySignatureAndCertificateChain", err);
      });

    PRINT("Trying to verify certificate chain");
    await this.VerifyCertificateChain()
      .then(() => {
        PRINT("Certificate chain verified");
      })
      .catch((err) => {
        ERROR("VerifySignatureAndCertificateChain", err);
      });

    PRINT("Trying to verify Firmware Properties");
    this.VerifyFirmwareProperties()
      .then(() => {
        PRINT("Firmware properties verified");
      })
      .catch((err) => {
        ERROR("VerifyFirmwareProperties", err);
      });

    return;
  }

  // VerifyFirmwareProperties
  private async VerifyFirmwareProperties() {
    if (this.manifest_json.FirmwareSize != this.firmware_bytes.length)
      ERROR("Firmware size is different from json file");
  }

  public VerifyVendorAndProductID(vendor_id: number, product_id: number) {
    let json_vendor: number = this.manifest_json.VendorId;
    let json_product: number = this.manifest_json.ProductId;

    // make it pass nrf dongle
    if (json_vendor == 0x1915)
      if (json_product == 0x521f || json_product == 0x520f)
        if (product_id != 0x521f && product_id != 0x520f)
          ERROR("Device's Product ID is different from json file");
        else return;

    if (vendor_id != json_vendor) ERROR("Device's Vendor ID is different from json file");
    if (product_id != json_product) ERROR("Device's Product ID is different from json file");
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
