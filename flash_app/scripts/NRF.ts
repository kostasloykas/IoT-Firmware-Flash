import {
  DEBUG,
  NRFInterface,
  FirmwareFile,
  CheckIfImageIsCompatibleForThisDevice,
  PRINT,
  UpdateProgressBar,
  ERROR,
  Packet,
  assert,
} from "./library";

enum OpcodeNRF {
  ProtocolVersion = 0x00,
  Create = 0x01,
  SetPacketReceiptNotification = 0x02,
  CRC = 0x03,
  Execute = 0x04,
  Select = 0x06,
  GetMTU = 0x7,
  Write = 0x08,
  Ping = 0x09,
  GetHWVersion = 0x0a,
  GetFWVersion = 0x0b,
  Abort = 0x0c,
}

// FIXME: NRF respond
enum RESPOND_NRF {}

export class NRF implements NRFInterface {
  port: any;
  writer: any;
  reader: any;
  encoder: any;
  decoder: any;
  filters: object = {
    dataBits: 8,
    baudRate: 115200, // 115200
    stopbits: 1,
    parity: "none",
    flowControl: "none",
  };

  mtu: number;

  public async FlashFirmware(port: any, image: FirmwareFile) {
    this.port = port;

    // check if image is compatible with this device
    // FIXME: compatibility
    // CheckIfImageIsCompatibleForThisDevice(["cc2538", "zoul", "zolertia"], image);

    // Open port
    PRINT("Try to open the port");
    await this.OpenPort()
      .then(() => {
        PRINT("Port opened");
      })
      .catch((error) => {
        ERROR("OpenPort:", error);
      });
    UpdateProgressBar("10%");

    //  initialize buffers
    this.reader = this.port.readable.getReader({ mode: "byob" });
    this.writer = this.port.writable.getWriter();

    await this.SendPRN()
      .then(() => PRINT("PRN send successfully"))
      .catch((err) => ERROR("SendPRN:", err));

    await this.ClosePort()
      .then(() => PRINT("Port closed successfully"))
      .catch((err) => ERROR("Port can't be closed ", err));
    UpdateProgressBar("100%");
  }

  async OpenPort() {
    await this.port.open(this.filters).catch((err: any) => ERROR("OpenPort:", err));
  }
  async ClosePort() {
    await this.reader.releaseLock();
    await this.writer.releaseLock();
    await this.port.close();
  }

  // Before the actual DFU process can start, the DFU controller must set the Packet Receipt Notification (PRN)
  // value and obtain the maximum transmission unit (MTU)
  async SendPRN() {
    // prn command
    let PRN: Uint8Array = new Uint8Array([OpcodeNRF.SetPacketReceiptNotification]);

    await this.Write(PRN).catch((err) => {
      ERROR("SendPRN:", err);
    });
  }

  GetResult(...params: any): void {
    throw new Error("Method not implemented.");
  }

  ProtocolVersion(...params: any): void {
    throw new Error("Method not implemented.");
  }

  Create(...params: any): void {
    throw new Error("Method not implemented.");
  }

  SetReceiptNotification(...params: any): void {
    throw new Error("Method not implemented.");
  }

  CRC(...params: any): void {
    throw new Error("Method not implemented.");
  }

  Execute(...params: any): void {
    throw new Error("Method not implemented.");
  }

  Select(...params: any): void {
    throw new Error("Method not implemented.");
  }

  GetMTU(...params: any): void {
    throw new Error("Method not implemented.");
  }

  Ping(...params: any): void {
    throw new Error("Method not implemented.");
  }

  GetHWVersion(...params: any): void {
    throw new Error("Method not implemented.");
  }

  GetFWVersion(...params: any): void {
    throw new Error("Method not implemented.");
  }

  Abort(...params: any): void {
    throw new Error("Method not implemented.");
  }

  CheckIfImageFitsInFlashMemory(...params: any): void {
    throw new Error("Method not implemented.");
  }

  // Write
  async Write(data: Uint8Array | Packet) {
    // if data are bytes
    if (data instanceof Uint8Array) {
      assert(data.length <= 253, "data length must be <= 253");
      await this.writer.write(data);
      // if data is packet
    } else if (data instanceof Packet) {
      let packet: Packet = data;
      await this.writer.write(new Uint8Array([packet.Size]));
      await this.writer.write(new Uint8Array([packet.Checksum]));
      await this.writer.write(data.Data);
    }
  }
}
