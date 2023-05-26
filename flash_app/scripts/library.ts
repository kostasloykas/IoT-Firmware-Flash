/* library.ts */

import { rejects } from "assert";
import { resolve } from "path";
import { NumericLiteral } from "../node_modules/typescript/lib/typescript";

declare global {
  interface Navigator {
    serial: any;
  }
}

// ============================= VARIABLES =============================

enum RESPOND {
  COMMAND_RET_SUCCESS = 0x40,
  COMMAND_RET_UNKNOWN_CMD = 0x41,
  COMMAND_RET_INVALID_ADR = 0x43,
  COMMAND_RET_FLASH_FAIL = 0x44,
}

const ACK = 0xcc;
const NACK = 0x33;

export enum SUPPORTED_DEVICES {
  CC2538 = "CC2538",
}

type DispatcherCreateInstance = {
  [key: string]: () => CC2538;
};

// Dispatcher for creating instances auto of a specific device
export const CreateInstanceOf: DispatcherCreateInstance = {
  [SUPPORTED_DEVICES.CC2538]: () => {
    return new CC2538();
  },
};

enum FILE_EXTENTION {
  HEX = "hex",
}

enum VERSION_CC2538 {
  _512_KB,
  _256_KB,
  _128_KB,
}

// ============================= FUNCTIONS =============================

export function PRINT(...anything: any): void {
  console.log(anything);
}

export function ERROR(...anything: any): void {
  throw new Error("ERROR: " + anything);
}

export function DEBUG(...anything: any): void {
  console.log("DEBUG", anything);
}

export function CheckForSerialNavigator(): void {
  // Web Serial API is not available
  if (!("serial" in navigator)) {
    alert("Web Serial API is not available");
    ERROR("Web Serial API is not available");
  }
}

// Assertions to ensure that certain conditions or
// assumptions hold true
export function assert(condition: unknown, msg: string): asserts condition {
  if (condition === false) throw new Error("Assertion: " + msg);
}

// ============================= INTERFACES =============================

interface Command {
  port: any;
  writer: any;
  reader: any;
  encoder: any;
  decoder: any;
  filters: object;

  InvokeBootloader(...params: any): void;
  OpenPort(...params: any): void;
  ClosePort(...params: any): void;
  MemoryWrite(...params: any): void;
  MemoryRead(...params: any): void;
  SendAck(...params: any): void;
  SendNAck(...params: any): void;
  ReceivePacket(...params: any): void;
  SendSync(...params: any): void;
  WaitForAck(...params: any): void;
  CRC32(...params: any): void;
  Download(...params: any): void;
  Run(...params: any): void;
  GetStatus(...params: any): void;
  Ping(...params: any): void;
  SendData(...params: any): void;
  Write(...params: any): void;
  Read(...params: any): void;
  Reset(...params: any): void;
  Erase(...params: any): void;
  GetChipID(...params: any): void;
  SetXOSC(...params: any): void;
  ClearInputBuffer(): void;
}

// ============================= CLASSES =============================

export class FirmwareFile {
  private firmware_bytes: Uint8Array;

  public constructor(input_element: HTMLInputElement) {
    this.CheckFileExtention(input_element.files[0].name);
    this.ConvertFirmwareToBytes(input_element).then((bytes) => {
      this.firmware_bytes = bytes;
      DEBUG(bytes);
    });
  }

  // Check file extention
  private CheckFileExtention(name: string): void {
    let extention: string = name.split(".").pop().toUpperCase();
    if (!(extention in FILE_EXTENTION)) ERROR("File extention is not supported");
  }

  // Convert firmware to bytes
  private ConvertFirmwareToBytes(input_element: HTMLInputElement): Promise<Uint8Array> {
    return new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = function (event) {
        PRINT("File Uploaded");
        const result = event.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(result);
        resolve(bytes);
      };

      reader.onerror = function (event) {
        reject(new Error("Error reading file."));
      };

      reader.readAsArrayBuffer(input_element.files[0]);
    });
  }
}

export class Packet {
  private size: Uint8Array;
  private checksum: Uint8Array;
  private data: Uint8Array;

  constructor(data: Uint8Array) {
    this.data = data;
    this.size = new Uint8Array([data.length]);
    this.checksum = this.ComputeChecksum();
  }

  public ComputeChecksum(): Uint8Array {
    const sum: number = this.data.reduce((sum, i) => sum + i);
    return new Uint8Array([sum]);
  }

  get Size(): Uint8Array {
    assert(this.size.length == 1, "Packet size.length must be 1 byte");
    return this.size;
  }

  get Checksum(): Uint8Array {
    assert(this.checksum.length == 1, "Packet checksum.length must be 1 byte");
    return this.checksum;
  }

  get Data(): Uint8Array {
    return this.data;
  }
}

// To encode data before send them to device
class Encoder {
  public encode(data: number[]): Uint8Array {
    const encodedData = new Uint8Array(data);
    return encodedData;
  }
}

// TODO: To decode data that send from device
class Decoder {
  public decode(data: number[]): Uint8Array {
    const decodedData = new Uint8Array(data);
    return decodedData;
  }
}

// ============================= SUPPORTED DEVICES =============================

export class CC2538 implements Command {
  private version: VERSION_CC2538;
  port: any;
  writer: any;
  reader: any;
  encoder: Encoder;
  decoder: Decoder;
  filters: object = {
    dataBits: 8,
    baudRate: 115200, //maximum 460800
    stopbits: 1,
    parity: "none",
    flowControl: "none", // Hardware flow control using the RTS and CTS signals is enabled.
    bufferSize: 128000000,
  };
  CHIP_ID: number[] = [0xb964, 0xb965];

  // TODO: Flash firmware
  FlashFirmware(port: any, image: FirmwareFile) {
    // Initialize
    this.port = port;
    this.encoder = new Encoder();
    this.decoder = new Decoder();

    this.OpenPort(); // Open port
    PRINT("Port opened");
    return;

    this.InvokeBootloader() //Invoke bootloader
      .catch((err) => {
        ERROR("Invoke bootloader problem", err);
      });
    PRINT("Bootloader invoked");

    this.SendSync();
    PRINT("Synchronized");
    return;

    // this.Ping();
    // PRINT("Bootloader pinged");

    let chip_id = this.GetChipID();
    return;

    this.ClosePort() // Close port
      .catch((err) => {
        ERROR("Port can't be closed ", err);
      });
  }

  async InvokeBootloader() {
    await this.port.setSignals({ dataTerminalReady: true });
    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for some time
    await this.port.setSignals({ dataTerminalReady: false });
  }

  OpenPort(): void {
    this.port.open(this.filters);
  }
  async ClosePort(...params: any) {
    await this.reader.close();
    await this.writer.close();
    await this.port.close();
    PRINT("Port closed");
  }
  //   TODO:
  MemoryWrite(...params: any): void {
    throw new Error("Method not implemented.");
  }
  //   TODO:
  MemoryRead(...params: any): void {
    throw new Error("Method not implemented.");
  }
  SendAck(...params: any): void {
    let ack: Uint8Array = new Uint8Array([0x00, ACK]);
    this.Write(ack);
  }
  SendNAck(...params: any): void {
    let nack: Uint8Array = new Uint8Array([0x00, NACK]);
    this.Write(nack);
  }
  //   TODO:
  ReceivePacket(...params: any): void {
    throw new Error("Method not implemented.");
  }

  //   TODO:
  SendSync(): void {
    let data: Uint8Array = this.encoder.encode([0x55]);
    this.ClearInputBuffer();

    this.Write(data).catch((err) => {
      ERROR("SendSynch", err);
    });
    this.Write(data).catch((err) => {
      ERROR("SendSynch", err);
    });

    this.WaitForAck().catch((err) => {
      ERROR("SendSynch", err);
    });
  }
  //   TODO:
  WaitForAck(): Promise<void> {
    let data: Uint8Array = null;
    this.Read(2).then((array) => (data = array));

    for (let byte of data) {
      if (byte == ACK) return;
      else if (byte == NACK) throw Error("Response was NACK");
    }

    throw Error("Unrecognized response (neither ACK nor NACK)");
  }

  //   TODO:
  SendData(...params: any): void {
    throw new Error("Method not implemented.");
  }
  //   TODO:
  CRC32(...params: any): void {
    throw new Error("Method not implemented.");
  }
  //   TODO:
  Download(...params: any): void {
    throw new Error("Method not implemented.");
  }
  //   TODO:
  Run(...params: any): void {
    throw new Error("Method not implemented.");
  }
  //   TODO:
  GetStatus(...params: any): void {
    throw new Error("Method not implemented.");
  }
  //   TODO:
  Ping(...params: any): void {
    throw new Error("Method not implemented.");
  }

  //   TODO:
  async Write(data: Uint8Array | Packet) {
    this.writer = this.port.getWriter();

    // if data are bytes
    if (data instanceof Uint8Array)
      if (data.length > 254) {
        let start: number = 0;
        let end: number = 0;
        for (let index = 0; index < data.length; index += 254) {
          let packet: Packet = new Packet(data.slice(index, index + 254));
          await this.writer.write(packet);
          start = index;
        }
      } else {
        await this.writer.write(data);
      }
    // if data is packet
    else if (data instanceof Packet) {
      let packet = data;
      this.writer.write(packet.Size);
      this.writer.write(packet.Checksum);
      this.writer.write(data.Data);
    }
    this.writer.realeaseLock();
  }

  //   TODO:
  async Read(length: number, timeout: number = 1000): Promise<Uint8Array> {
    this.reader = this.port.getReader();
    const { data, done } = await Promise.race([
      this.reader.read(length),
      new Promise<void>((resolve, reject) =>
        setTimeout(() => reject(new Error("Timeout occurred")), timeout)
      ),
    ]);

    if (data) {
      DEBUG(this.decoder.decode(data));
    }

    this.reader.releaseLock();
    let data_arr: Uint8Array = this.decoder.decode(data);

    //return an array of Uint8Array type
    return new Promise((resolve, reject) => resolve(data_arr));
  }
  //   TODO:
  Reset(...params: any): void {
    throw new Error("Method not implemented.");
  }
  //   TODO:
  Erase(...params: any): void {
    throw new Error("Method not implemented.");
  }
  //   TODO:
  GetChipID(): void {
    // send the command
    this.Write(new Packet(new Uint8Array([0x20]))).catch((err) => ERROR("GetChipID", err));
    // wait for ACK
    this.WaitForAck().catch((err) => ERROR("GetChipID", err));
    // read 4 bytes that contain chip id
    this.Read(4)
      .then((array: Uint8Array) => {
        let chip_id: number = ((array[0] << 8) | array[1]) as number;
        if (chip_id in this.CHIP_ID) ERROR("Chip Id wasn't the right");
      })
      .catch((err) => ERROR("GetChipID trying to read chip id from buffer", err)); // read 4 bytes that is chip id
    // send ACK
    this.SendAck();
    return;
  }
  //   TODO:
  SetXOSC(...params: any): void {
    throw new Error("Method not implemented.");
  }

  async ClearInputBuffer() {
    const reader = this.port.readable.getReader();

    // Read and discard data until the buffer is empty
    while (true) {
      const { value, done } = await reader.read();
      if (done) break; // Buffer is empty, exit the loop
    }

    reader.releaseLock();
  }
}
