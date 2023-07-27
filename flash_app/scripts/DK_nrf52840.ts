import { DEBUG, ERROR, FirmwareFile, PRINT } from "./classes";
import { NRF_DK_Interface } from "./interfaces";

export class NRF_DK implements NRF_DK_Interface {
  port: any = null;
  writer: any = null;
  reader: any = null;
  filters: any = null;

  public async FlashFirmware(port: any, image: FirmwareFile) {
    // open port
    this.port = port;

    PRINT("Try to open port");
    await this.OpenPort()
      .then(() => PRINT("Port opened successfully"))
      .catch((err) => ERROR("OpenPort", err));

    // reset device
    PRINT("Try to reset device");
    await this.Reset()
      .then(() => PRINT("Device has been reset"))
      .catch((err) => ERROR("Reset", err));

    // close port
    PRINT("Try to close port");
    await this.ClosePort()
      .then(() => PRINT("Port closed successfully"))
      .catch((err) => ERROR("ClosePort", err));
  }

  // FIXME: OpenPort
  async OpenPort() {
    throw new Error("Method not implemented.");
  }

  // FIXME: ClosePort
  async ClosePort() {
    throw new Error("Method not implemented.");
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
