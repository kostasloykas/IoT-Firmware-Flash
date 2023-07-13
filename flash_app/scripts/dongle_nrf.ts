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

// operation code
enum OP_CODE {
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
  Response = 0x60,
}

// result code
enum RES_CODE {
  InvalidCode = 0x00,
  Success = 0x01,
  NotSupported = 0x02,
  InvalidParameter = 0x03,
  InsufficientResources = 0x04,
  InvalidObject = 0x05,
  InvalidSignature = 0x06,
  UnsupportedType = 0x07,
  OperationNotPermitted = 0x08,
  OperationFailed = 0x0a,
  ExtendedError = 0x0b,
}

// Serial Line Internet Protocol (SLIP) library encodes and decodes SLIP packets
class Slip {
  static SLIP_BYTE_END = 0o300;
  static SLIP_BYTE_ESC = 0o333;
  static SLIP_BYTE_ESC_END = 0o334;
  static SLIP_BYTE_ESC_ESC = 0o335;

  static SLIP_STATE_DECODING = 1;
  static SLIP_STATE_ESC_RECEIVED = 2;
  static SLIP_STATE_CLEARING_INVALID_PACKET = 3;

  static encode(data: Uint8Array): Uint8Array {
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
  // FIXME: decode
  static decode_add_byte(
    c: number,
    decoded_data: number[],
    current_state: number
  ): [boolean, number, number[]] {
    //
    //
    let finished: boolean = false;

    if (current_state === Slip.SLIP_STATE_DECODING) {
      if (c === Slip.SLIP_BYTE_END) {
        finished = true;
      } else if (c === Slip.SLIP_BYTE_ESC) {
        current_state = Slip.SLIP_STATE_ESC_RECEIVED;
      } else {
        decoded_data.push(c);
      }
    } else if (current_state === Slip.SLIP_STATE_ESC_RECEIVED) {
      if (c === Slip.SLIP_BYTE_ESC_END) {
        decoded_data.push(Slip.SLIP_BYTE_END);
        current_state = Slip.SLIP_STATE_DECODING;
      } else if (c === Slip.SLIP_BYTE_ESC_ESC) {
        decoded_data.push(Slip.SLIP_BYTE_ESC);
        current_state = Slip.SLIP_STATE_DECODING;
      } else {
        current_state = Slip.SLIP_STATE_CLEARING_INVALID_PACKET;
      }
    } else if (current_state === Slip.SLIP_STATE_CLEARING_INVALID_PACKET) {
      if (c === Slip.SLIP_BYTE_END) {
        current_state = Slip.SLIP_STATE_DECODING;
        decoded_data = [];
      }
    }

    return [finished, current_state, decoded_data];
  }
}

export class NRF_DONGLE implements NRFInterface {
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

    PRINT("Try to Set Receipt Notification");
    await this.SetReceiptNotification()
      .then(() => PRINT("Receipt Notification set successfully"))
      .catch((err) => ERROR("SendPRN:", err));

    // PRINT("Try to get MTU");
    // await this.GetMTU()
    //   .then((mtu) => {
    //     PRINT("MTU is", mtu);
    //   })
    //   .catch((err) => ERROR("GetMTU", err));

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

  //FIXME: GetResponse
  async GetResponse(operation: number) {
    // read packet
    await this.ReadInto(new ArrayBuffer(1))
      .then((byte) => {})
      .catch((err) => ERROR("GetResponse:", err));
  }

  //FIXME: GetPacket
  async GetPacket(): Promise<Uint8Array> {
    let current_state = Slip.SLIP_STATE_DECODING;
    let finished = false;
    let decoded_data: number[];
    let byte: number;

    while (!finished) {
      //read 1 byte
      await this.ReadInto(new ArrayBuffer(1))
        .then((buffer) => (byte = buffer[0]))
        .catch((err) => ERROR("GetPacket", err));
      [finished, current_state, decoded_data] = Slip.decode_add_byte(byte, decoded_data, current_state);
    }

    return Uint8Array.from(decoded_data);
  }

  ProtocolVersion(...params: any): void {
    throw new Error("Method not implemented.");
  }

  Create(...params: any): void {
    throw new Error("Method not implemented.");
  }

  // FIXME: SetReceiptNotification
  // Before the actual DFU process can start, the DFU controller must set the Packet Receipt Notification (PRN)
  // value and obtain the maximum transmission unit (MTU)
  async SetReceiptNotification(...params: any) {
    // prn command
    let opPRN: Uint8Array = Slip.encode(new Uint8Array([OP_CODE.SetPacketReceiptNotification, 0x00, 0x01]));

    // send command
    await this.Write(opPRN).catch((err) => {
      ERROR("SendPRN:", err);
    });

    // get response
    await this.GetResponse(OP_CODE.SetPacketReceiptNotification)
      .then((result) => {})
      .catch((err) => ERROR("SetReceiptNotification", err));
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

  // FIXME: GetMTU
  async GetMTU(): Promise<number> {
    let opMTU: Uint8Array = new Uint8Array([OP_CODE.GetMTU]);

    // send command
    await this.Write(opMTU).catch((err) => ERROR("GetMTU:", err));

    // wait for response
    await this.GetResponse(OP_CODE.GetMTU)
      .then((result) => {})
      .catch((err) => {});
    //FIXME: return
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
