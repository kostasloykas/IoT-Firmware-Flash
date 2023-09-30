import { assert, DEBUG, ERROR, PRINT } from "../classes";

export class ManifestJSON {
  private manifest_version: number = null;
  private common_name: number = null;
  private vendor_id: number = null;
  private product_id: number = null;
  private timestamp: string = null;
  private hash_algorithm: string = null;
  private sign_algorithm_type: string = null;
  private sign_algorithm_public_key: string = null;
  private firmware_type: string = null;
  private firmware_size: number = null;

  constructor(json: any) {
    // check the manifest version
    this.manifest_version = Number.parseInt(json.manifest_version);

    switch (this.manifest_version) {
      case 1:
        this.ManifestVersion_1(json);
        break;

      default:
        ERROR("Unknown Manifest Version");
        break;
    }
  }

  // Manifest version is 1
  private ManifestVersion_1(json: any) {
    this.common_name = json.common_name;
    this.vendor_id = Number.parseInt(json.vendor_id);
    this.product_id = Number.parseInt(json.product_id);
    this.timestamp = json.timestamp;
    this.hash_algorithm = json.hash_algorithm;
    this.firmware_size = Number.parseInt(json.firmware_size);
    this.firmware_type = json.firmware_type;
    this.sign_algorithm_public_key = json.sign_algorithm["public_key"];
    this.sign_algorithm_type = json.sign_algorithm["type"];

    assert(this.common_name != null, "ManifestJSON common name != null");
    assert(this.vendor_id != null, "ManifestJSON vendor id != null");
    assert(this.product_id != null, "ManifestJSON product id != null");
    assert(this.timestamp != null, "ManifestJSON timestamp != null");
    assert(this.hash_algorithm != null, "ManifestJSON hash algorithm != null");
    assert(this.firmware_size != null, "ManifestJSON firmware size != null");
    assert(this.firmware_type != null, "ManifestJSON firmware type != null");
    assert(this.sign_algorithm_public_key != null, "ManifestJSON sign algorithm public key != null");
    assert(this.sign_algorithm_type != null, "ManifestJSON sign algorithm type != null");
  }

  get ManifestVersion(): number {
    return this.manifest_version;
  }

  get CommonName(): number {
    return this.common_name;
  }

  get VendorId(): number {
    return this.vendor_id;
  }

  get ProductId(): number {
    return this.product_id;
  }

  get Timestamp(): string {
    return this.timestamp;
  }

  get HashAlgorithm(): string {
    return this.hash_algorithm;
  }

  get SignAlgorithmType(): string {
    return this.sign_algorithm_type;
  }

  get SignAlgorithmPublicKey(): string {
    return this.sign_algorithm_public_key;
  }

  get FirmwareType(): string {
    return this.firmware_type;
  }

  get FirmwareSize(): number {
    return this.firmware_size;
  }
}
