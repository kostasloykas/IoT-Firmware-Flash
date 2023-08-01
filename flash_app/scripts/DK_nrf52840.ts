import { CheckIfImageIsCompatibleForThisDevice, DEBUG, ERROR, FirmwareFile, PRINT } from "./classes";
import { NRF_DK_Interface } from "./interfaces";

export class NRF_DK implements NRF_DK_Interface {
  usb: any = null;
  writer: any = null;
  reader: any = null;
  filters: any = null;

  public async FlashFirmware(usb: any, image: FirmwareFile) {
    //FIXME: check compatibility
    CheckIfImageIsCompatibleForThisDevice([""], image);

    this.usb = usb;

    PRINT("Try to open port");
    await this.OpenPort()
      .then(() => PRINT("Port opened successfully"))
      .catch((err) => ERROR("OpenPort", err));

    return;
    // reset device
    PRINT("Try to reset device");
    // await this.Reset()
    //   .then(() => PRINT("Device has been reset"))
    //   .catch((err) => ERROR("Reset", err));

    // close port
    PRINT("Try to close port");
    await this.ClosePort()
      .then(() => PRINT("Port closed successfully"))
      .catch((err) => ERROR("ClosePort", err));
  }

  // FIXME: OpenPort
  async OpenPort() {
    this.usb.open();
  }

  // FIXME: ClosePort
  async ClosePort() {
    throw new Error("Method not implemented.");
  }

  // FIXME: GetDfuInterfaceNumber
  async GetDfuInterfaceNumber(device: any): Promise<number> {
    const interfaces = device.configuration.interfaces;

    if (device.configuration == null) return null;

    for (let interface_iter of interfaces) {
      // if (
      //   interface_iter.alternate.interfaceClass == 255 &&
      //   interface_iter.alternate.interfaceSubclass == 1 &&
      //   interface_iter.alternate.interfaceProtocol == 1
      // )
      //   return interface_iter.interfaceNumber;

      DEBUG(interface_iter);
    }

    return null;
  }

  // FIXME: BulkTransfer
  async BulkTransfer() {
    throw new Error("Method not implemented.");
  }

  // FIXME: Reset
  async Reset(...params: any) {
    throw new Error("Method not implemented.");
  }
}
