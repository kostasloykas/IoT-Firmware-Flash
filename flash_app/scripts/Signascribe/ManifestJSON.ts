import { DEBUG, ERROR, PRINT } from "../classes";

export class ManifestJSON {
  // FIXME: create the attributes
  private manifest_version: number = null;
  private common_name: number = null;
  private vendor_id: number = null;
  private product_id: number = null;
  private timestamp: string = null;
  private hash_algorithm: string = null;
  private sign_algorithm_type: string = null;
  private sign_algorithm_public_key: any = null;
  private firmware_type: any = null;
  private firmware_size: any = null;

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
    this.vendor_id = json.vendor_id;
    this.product_id = json.product_id;
    this.timestamp = json.timestamp;
    this.hash_algorithm = json.hash_algorithm;
    this.firmware_size = json.firmware_size;
    this.firmware_type = json.firmware_type;
    this.sign_algorithm_public_key = json.sign_algorithm["public_key"];
    this.sign_algorithm_type = json.sign_algorithm["type"];
  }
}
