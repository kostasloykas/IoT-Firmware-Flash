import {
  CheckIfImageIsCompatibleForThisDevice,
  DEBUG,
  ERROR,
  FirmwareFile,
  PRINT,
  UpdateProgressBar,
  assert,
} from "./classes";
import { NRF_DK_Interface } from "./interfaces";

declare global {
  interface Window {
    showSaveFilePicker: (...params: any) => Promise<FileSystemFileHandle>;
  }
}
export class NRF_DK implements NRF_DK_Interface {
  usb: any = null;
  writer: any = null;
  reader: any = null;

  public async FlashFirmware(usb: any, image: FirmwareFile) {
    //FIXME: check compatibility
    CheckIfImageIsCompatibleForThisDevice([""], image);

    await this.SaveFileToDevice();
    UpdateProgressBar("100");
  }

  async SaveFileToDevice() {
    console.log("Running");

    const handle = await window.showSaveFilePicker({
      suggestedName: "data.csv",
      types: [
        {
          description: "CSV Data",
          accept: { "text/plain": [".csv"] },
        },
      ],
    });
    const blob = new Blob([`{csv_data}`]);

    const writableStream = await handle.createWritable();
    await writableStream.write(blob);
    await writableStream.close();
  }

  OpenPort(...params: any): void {
    throw new Error("Method not implemented.");
  }
  ClosePort(...params: any): void {
    throw new Error("Method not implemented.");
  }
  Reset(...params: any): void {
    throw new Error("Method not implemented.");
  }
}
