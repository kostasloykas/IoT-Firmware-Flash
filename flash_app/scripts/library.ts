/* library.ts */

import { rejects } from "assert";
import { resolve } from "path";

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
  Encoder: any;
  Decoder: any;
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
  private size: number;
  private checksum: number;
  private data: Uint8Array;

  constructor(data: Uint8Array) {
    this.data = data;
    this.size = data.length;
    this.checksum = this.ComputeChecksum();
  }

  public ComputeChecksum(): number {
    const sum: number = this.data.reduce((sum, i) => sum + i);
    return sum;
  }

  get Size(): number {
    return this.size;
  }

  get Checksum(): number {
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

// To decode data that send from device
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
  Encoder: any;
  Decoder: any;
  filters: object = {
    dataBits: 8,
    baudRate: 500000,
    stopbits: 1,
    parity: "none",
    flowControl: "none", // Hardware flow control using the RTS and CTS signals is enabled.
    bufferSize: 128000000,
  };

  // TODO: Flash firmware
  FlashFirmware(port: any, image: FirmwareFile) {
    // Initialize
    this.port = port;
    this.reader = port.readable.getReader();
    this.writer = port.writable.getWriter();
    this.Encoder = new Encoder();
    this.Decoder = new Decoder();

    this.OpenPort(); // Open port

    // this.InvokeBootloader() //Invoke bootloader
    //   .catch((err) => {
    //     ERROR("Invoke bootloader problem", err);
    //   });

    this.SendSync();
    this.ClosePort() // Close port
      .catch((err) => {
        ERROR("Port closed problem", err);
      });
  }

  async InvokeBootloader() {
    await this.port.setSignals({ dataTerminalReady: true });
    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for some time
    await this.port.setSignals({ dataTerminalReady: false });
  }

  OpenPort(): void {
    this.port.open(this.filters);
    PRINT("Port opened");
  }
  async ClosePort(...params: any) {
    await this.reader.close();
    await this.writer.close();
    await this.port.close();
    PRINT("Port closed");
  }
  MemoryWrite(...params: any): void {
    throw new Error("Method not implemented.");
  }
  MemoryRead(...params: any): void {
    throw new Error("Method not implemented.");
  }
  SendAck(...params: any): void {
    throw new Error("Method not implemented.");
  }
  SendNAck(...params: any): void {
    throw new Error("Method not implemented.");
  }
  ReceivePacket(...params: any): void {
    throw new Error("Method not implemented.");
  }

  SendSync(): void {
    let data: Uint8Array = this.Encoder.encode([0x55]);
    this.Write(data).catch((err) => {
      ERROR("Send Synch", err);
    });
    this.Write(data).catch((err) => {
      ERROR("Send Synch", err);
    });

    this.WaitForAck();
  }
  //   TODO:
  WaitForAck() {
    this.Read(2); // wait for 2 bytes
    return;
  }
  SendData(...params: any): void {
    throw new Error("Method not implemented.");
  }
  CRC32(...params: any): void {
    throw new Error("Method not implemented.");
  }
  Download(...params: any): void {
    throw new Error("Method not implemented.");
  }
  Run(...params: any): void {
    throw new Error("Method not implemented.");
  }
  GetStatus(...params: any): void {
    throw new Error("Method not implemented.");
  }
  Ping(...params: any): void {
    throw new Error("Method not implemented.");
  }

  async Write(data: Uint8Array | Packet) {
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

    // Allow the serial port to be closed later.
    this.writer.releaseLock();
  }

  async Read(length: number, timeout: number = 1000) {
    const { data, done } = await Promise.race([
      this.reader.read(length),
      new Promise<void>((resolve, reject) =>
        setTimeout(() => reject(new Error("Timeout occurred")), timeout)
      ),
    ]);

    if (done) {
      // Allow the serial port to be closed later.
      this.reader.releaseLock();
    }
    if (data) {
      DEBUG(this.Decoder.decode(data));
    }
  }
  Reset(...params: any): void {
    throw new Error("Method not implemented.");
  }
  Erase(...params: any): void {
    throw new Error("Method not implemented.");
  }
  GetChipID(...params: any): void {
    throw new Error("Method not implemented.");
  }
  SetXOSC(...params: any): void {
    throw new Error("Method not implemented.");
  }
}
