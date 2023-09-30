import AdmZip from "adm-zip";
import { ERROR, FirmwareFile, NRFZIP, PRINT } from "../classes";
import { TilergatisZip } from "./TilergatisZip";
import { Buffer } from "buffer";

// GenericZip class
export class GenericZip {
  private zip_file: AdmZip = null;

  public async ReturnTilergatisZipAndImage(
    input_element: HTMLInputElement
  ): Promise<[TilergatisZip, FirmwareFile | NRFZIP]> {
    await this.ConvertZipFileToBytes(input_element)
      .then((bytes) => {
        this.zip_file = new AdmZip(Buffer.from(bytes));
      })
      .catch((err) => ERROR("ReturnTilergatisZipAndImage", err));

    // Recognize if it is tilergatis zip or firmware file
    if (this.ZipFileIsFromTilergatis()) {
      PRINT("Zip file is from Tilergatis");
      let [zip1, zip2]: [TilergatisZip, NRFZIP | FirmwareFile] = this.CreateTilergatisZipFileAndImage(
        this.zip_file
      );
      // return tilergatis zip and image
      return [zip1, zip2];
    } else {
      PRINT("Zip file is not from Tilergatis");

      // I guess that zip is from nordic
      let zip: NRFZIP = new NRFZIP(new Uint8Array(this.zip_file.toBuffer()));

      // return only zip file
      return [null, zip];
    }

    return [null, null];
  }

  // CreateTilergatisZipFileAndImage
  private CreateTilergatisZipFileAndImage(zip_file: AdmZip): [TilergatisZip, NRFZIP | FirmwareFile] {
    let tilergatis_zip = new TilergatisZip(zip_file);
    let image = tilergatis_zip.Firmware; // Take firmware from tilergatis zip file

    return [tilergatis_zip, image];
  }

  private ZipFileIsFromTilergatis(): boolean {
    let found: boolean = false;

    this.zip_file.forEach((entry: any) => {
      let name: string = entry.entryName;
      if (name == "tilergatis_manifest.json") found = true;
    });

    return found;
  }

  // Convert zip file to bytes
  private async ConvertZipFileToBytes(input_element: HTMLInputElement): Promise<Uint8Array> {
    return await new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();
      let file = input_element.files[0];
      let type: string = file.name.split(".").pop();

      // on error
      reader.onerror = function (event) {
        reject(new Error("Error reading file."));
      };

      // read zip file
      if (type == "zip") {
        reader.onload = function (event) {
          const result = event.target?.result as ArrayBuffer;
          let bytes: Uint8Array = new Uint8Array(result);
          resolve(bytes);
        };

        reader.readAsArrayBuffer(file);
      } else ERROR("Unknown type of input file");
    });
  }
}
