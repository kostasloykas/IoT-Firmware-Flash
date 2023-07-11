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

// Serial Line Internet Protocol (SLIP) library encodes and decodes SLIP packets
class Slip {
  SLIP_BYTE_END = 0o300;
  SLIP_BYTE_ESC = 0o333;
  SLIP_BYTE_ESC_END = 0o334;
  SLIP_BYTE_ESC_ESC = 0o335;

  public encode(data: Uint8Array): Uint8Array {
    let encoded_data: Array<number> = new Array<number>();

    for (const iter of data) {
      if (iter == this.SLIP_BYTE_END) {
        encoded_data.push(this.SLIP_BYTE_ESC);
        encoded_data.push(this.SLIP_BYTE_ESC_END);
      } else if (iter == this.SLIP_BYTE_ESC) {
        encoded_data.push(this.SLIP_BYTE_ESC);
        encoded_data.push(this.SLIP_BYTE_ESC_ESC);
      } else {
        encoded_data.push(iter);
      }
    }

    encoded_data.push(this.SLIP_BYTE_END);

    return Uint8Array.from(encoded_data);
  }

  public decode(data: Uint8Array) {
    let decoded_data;
    for (let iter of data) {
    }

    return decoded_data;
  }
}

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

  MTU: number;

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

    // await this.port.setSignals({ dataTerminalReady: true, requestToSend: true });

    PRINT("Try to Send PRN");
    await this.SendPRN()
      .then(() => PRINT("PRN send successfully"))
      .catch((err) => ERROR("SendPRN:", err));

    PRINT("Try to get MTU");
    await this.GetMTU()
      .then((mtu) => {
        PRINT("MTU is", mtu);
      })
      .catch((err) => ERROR("GetMTU", err));

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
    let opPRN: Uint8Array = new Uint8Array([OpcodeNRF.SetPacketReceiptNotification]);

    // send command
    await this.Write(opPRN).catch((err) => {
      ERROR("SendPRN:", err);
    });
  }

  async GetResult() {
    let result: Uint8Array = null;
    await this.ReadInto(new ArrayBuffer(1), 1000)
      .then((buffer) => {
        result = buffer;
      })
      .catch((err) => {
        ERROR("GetResult:", err);
      });

    assert(result != null, "result must be != null");
    DEBUG("result =", result);
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

  async GetMTU(): Promise<number> {
    let opMTU: Uint8Array = new Uint8Array([OpcodeNRF.GetMTU]);

    // send command
    await this.Write(opMTU).catch((err) => {
      ERROR("GetMTU:", err);
    });

    // wait for response
    await this.GetResult().then().catch();
    return 1;
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
  async Write(data: Uint8Array) {
    await this.writer.write(data);
  }

  // ReadInto
  async ReadInto(buffer: ArrayBuffer, time_to_wait: number = 100) {
    let offset = 0;
    let timeout = null;

    while (offset < buffer.byteLength) {
      timeout = setTimeout(() => {
        this.ClosePort();
      }, time_to_wait);

      const { value, done } = await this.reader.read(new Uint8Array(buffer, offset));
      clearTimeout(timeout);
      if (done) {
        break;
      }
      buffer = value.buffer;
      offset += value.byteLength;
    }

    return new Uint8Array(buffer);
  }
}