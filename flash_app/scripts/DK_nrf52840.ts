import { DEBUG, ERROR, FirmwareFile, PRINT, UpdateProgressBar, assert } from "./classes";

declare global {
  interface Window {
    showSaveFilePicker: (...params: any) => Promise<FileSystemFileHandle>;
  }
}
export class NRF_DK {
  usb: any = null;
  writer: any = null;
  reader: any = null;

  public async FlashFirmware(usb: any, image: FirmwareFile) {
    UpdateProgressBar("30%");

    // save file into device
    PRINT("Trying to flash firmware in device");
    await this.SaveFileToDevice(image)
      .then(() => PRINT("Firmware flashed into device"))
      .catch((err) => ERROR("SaveFileToDevice", err));
    UpdateProgressBar("100%");
  }

  async SaveFileToDevice(image: FirmwareFile) {
    assert(image.FirmwareHexBytes != null, "FirmwareHexBytes must be != null");

    const handle = await window.showSaveFilePicker({
      suggestedName: "firmware.hex",
      types: [
        {
          description: "HEX Data",
          accept: { "text/plain": [".hex"] },
        },
      ],
    });
    const blob = new Blob([...image.FirmwareHexBytes]);

    const writableStream = await handle.createWritable();
    await writableStream.write(blob);
    await writableStream.close();
  }
}
