/* library.ts */

import { isObjectLiteralElement } from "../node_modules/typescript/lib/typescript";
import { CC2538 } from "./cc2538";

declare global {
  interface Navigator {
    serial: any;
  }
}

// ============================= INTERFACES =============================

export interface Command {
  port: any;
  writer: any;
  reader: any;
  encoder: any;
  decoder: any;
  filters: object;
  start_address: number;

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
  ClearInputBuffer(...params: any): void;
  CheckLastCommand(...params: any): void;
  ConfigureCCA(...params: any): void;
  FlashSize(...params: any): void;
}

// ============================= CLASSES =============================

export class Device {
  vendor: number;
  product: number;
  constructor(vendor: number, product: number) {
    this.vendor = vendor;
    this.product = product;
  }
}

export class FirmwareFile {
  private firmware_bytes: Uint8Array;
  private size: number;

  public constructor(input_element: HTMLInputElement) {
    this.CheckFileExtention(input_element.files[0].name);
    this.ConvertFirmwareToBytes(input_element).then((bytes) => {
      this.firmware_bytes = bytes;
      DEBUG(bytes);
      this.size = this.firmware_bytes.length;
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

  public get Size(): number {
    return this.size;
  }
}

export class Packet {
  private size: Uint8Array;
  private checksum: Uint8Array;
  private data: Uint8Array;

  constructor(data: Uint8Array) {
    assert(data.length + 2 <= 256, "data size must be <= 256 bytes");
    this.data = data;
    this.size = new Uint8Array([data.length + 2]);
    this.checksum = this.ComputeChecksum();
  }

  public ComputeChecksum(): Uint8Array {
    const sum: number = this.data.reduce((sum, i) => sum + i && 0xff);
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

// ============================= VARIABLES =============================

export enum RESPOND {
  COMMAND_RET_SUCCESS = 0x40,
  COMMAND_RET_UNKNOWN_CMD = 0x41,
  COMMAND_RET_INVALID_ADR = 0x43,
  COMMAND_RET_FLASH_FAIL = 0x44,
}

export const ACK = 0xcc;
export const NACK = 0x33;

export let SUPPORTED_DEVICES: Map<Device, any> = new Map<Device, any>();
SUPPORTED_DEVICES.set(new Device(0x10c4, 0xea60), new CC2538()); // Zolertia CC2538
DEBUG(SUPPORTED_DEVICES.size);
DEBUG(SUPPORTED_DEVICES.has({ vendor: 0x10c4, product: 0xea60 }));

// FIXME: supported file extentions
export enum FILE_EXTENTION {
  HEX = "hex",
}

// ============================= FUNCTIONS =============================

export function PRINT(...anything: any): void {
  console.log(anything);
}

export function ERROR(...anything: any): void {
  throw new Error(anything);
}

export function DEBUG(...anything: any): void {
  console.log("DEBUG", anything);
}

export function CheckForSerialNavigator(): void {
  // Web Serial API is not available
  if (!("serial" in navigator)) {
    ERROR("Web Serial API is not available");
  }
}

// Assertions to ensure that certain conditions or
// assumptions hold true
export function assert(condition: unknown, msg: string): asserts condition {
  if (condition === false) throw new Error("Assertion: " + msg);
}
