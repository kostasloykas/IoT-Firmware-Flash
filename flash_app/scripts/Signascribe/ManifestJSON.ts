import { DEBUG } from "../classes";

export class ManifestJSON {
  // FIXME: create the attributes
  private manifest_version: string = null;
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
  }
}
