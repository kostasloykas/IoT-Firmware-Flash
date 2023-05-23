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
    DEBUG(name);
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
    this.size = this.SizeOfPacket(data);
    this.checksum = this.ComputeChecksum(data);
  }

  public SizeOfPacket(data: Uint8Array): number {
    return 0;
  }

  public ComputeChecksum(data: Uint8Array): number {
    return 0;
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

    this.OpenPort(); // Open port

    this.ClosePort() // Close port
      .then((port_closed) => {
        if (port_closed) PRINT("Port closed");
      })
      .catch((err) => {
        ERROR(err);
      });
  }

  OpenPort(): void {
    this.port.open(this.filters);
    PRINT("Port opened");
  }
  ClosePort(...params: any): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      await this.reader.close();
      await this.writer.close();
      await this.port.close();
      resolve(true);
    });
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
  SendSync(...params: any): void {
    throw new Error("Method not implemented.");
  }
  WaitForAck(...params: any): void {
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
  SendData(...params: any): void {
    throw new Error("Method not implemented.");
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
