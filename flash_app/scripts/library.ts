/* library.ts */
import $ from "jquery";
import crc32 from "crc-32";
import sha256, { x2 } from "sha256";
import MemoryMap, * as kos from "./modul.js";

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
  filters: any;

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
  Verify(...params: any): void;
  Run(...params: any): void;
  GetStatus(...params: any): void;
  CheckIfStatusIsSuccess(...params: any): void;
  Ping(...params: any): void;
  SendData(...params: any): void;
  Write(...params: any): void;
  Reset(...params: any): void;
  Erase(...params: any): void;
  EraseBank(...params: any): void;
  GetChipID(...params: any): void;
  SetXOSC(...params: any): void;
  SizeOfFlashMemory(...params: any): void;
  WriteFlash(...params: any): void;
  BootloaderInformations(...params: any): void;
  CheckIfImageFitsInFlashMemory(...params: any): void;
}

// ============================= CLASSES =============================

export class Device {
  vendor: number;
  product: number;
  constructor(vendor: number, product: number) {
    this.vendor = vendor;
    this.product = product;
  }

  // something like operator overload ==
  equals(other: Device): boolean {
    return this.vendor == other.vendor && this.product == other.product;
  }
}

export class FirmwareFile {
  private firmware_bytes: Uint8Array;
  private hash: number[] = null;
  private size: number;
  private crc32: number;

  public constructor(input_element: HTMLInputElement) {
    this.CheckFileExtention(input_element.files[0].name);
    this.ConvertFirmwareToBytes(input_element)
      .then((bytes) => {
        this.firmware_bytes = bytes;
        this.size = this.firmware_bytes.length;
        this.CalculateCRC32();
        // FIXME: compute sha256 of image and take the encrypted sha256 of image and decrypted
        this.ComputeHash(this.firmware_bytes);
      })
      .catch((err) => {
        ERROR("ConvertFirmwareToBytes", err);
      });
  }

  private ComputeHash(bytes: Uint8Array): void {
    // FIXME: exclude signature's bytes from array
    // we convert unint8array to array with the operator [...bytes]
    this.hash = sha256([...bytes], { asBytes: true });
  }

  public VerifyTilergatiSignature(): void {
    assert(this.hash != null, "Signature must be != null");
    // FIXME: define where the signature is
    let encrypted_hash = null;
    let decrypted_hash = null;

    if (decrypted_hash != this.hash) ERROR("Signature is not from Tilergati's site");
  }

  // Check file extention
  private CheckFileExtention(name: string): void {
    let extention: string = name.split(".").pop().toUpperCase();
    if (!(extention in FILE_EXTENTION)) ERROR("File extention is not supported");
  }

  // Convert firmware to bytes
  private async ConvertFirmwareToBytes(input_element: HTMLInputElement): Promise<Uint8Array> {
    return await new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();
      let file = input_element.files[0];
      let type: string = file.name.split(".").pop();

      reader.onloadend = function (event) {
        PRINT("File Uploaded");
      };

      reader.onerror = function (event) {
        reject(new Error("Error reading file."));
      };

      // read hex file
      if (type == "hex") {
        reader.onload = function (event) {
          let hexdata: string = event.target?.result as string;
          kos.default.fromHex(hexdata);
          let memMap = MemoryMap.fromHex(hexdata);

          for (let [address, dataBlock] of memMap) {
            console.log("Data block at ", address, ", bytes: ", dataBlock);
          }

          // result = result.replace(/\n/g, "").replace(/:/g, "");
          // assert(isHex(result) == true, "");
          // let bytes: Uint8Array = hexStringToUint8Array(result);
          // resolve(bytes);
        };
        reader.readAsText(file);
        // read bin file
      } else if (type == "bin") {
        reader.onload = function (event) {
          const result = event.target?.result as ArrayBuffer;
          let bytes: Uint8Array = new Uint8Array(result);
          DEBUG(bytes);
          resolve(bytes);
        };

        reader.readAsArrayBuffer(file);
      } else ERROR("unknown type of input file");
    });
  }

  private CalculateCRC32() {
    this.crc32 = crc32.buf(this.firmware_bytes);
  }

  public get CRC32(): number {
    return this.crc32;
  }

  public get Size(): number {
    return this.size;
  }

  public get FirmwareBytes(): Uint8Array {
    return this.firmware_bytes;
  }
}

export class Packet {
  private size: number;
  private checksum: number;
  private data: Uint8Array;

  constructor(data: Uint8Array) {
    assert(data.length + 2 <= 255, "data size must be <= 255 bytes");
    this.data = data;
    this.size = data.length + 2;
    this.checksum = this.ComputeChecksum();
  }

  public ComputeChecksum(): number {
    const checksum: number = this.data.reduce((sum, i) => sum + i) % 256;
    return checksum;
  }

  get Size(): number {
    assert(this.size <= 255, "size must be 1 byte");
    return this.size;
  }

  get Checksum(): number {
    assert(this.checksum <= 255, "checksum must be 1 byte");
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

export enum FILE_EXTENTION {
  HEX = "hex",
  BIN = "bin",
}

// ============================= FUNCTIONS =============================

// Check if device supported
// If yes the returns an instance of device
// If no returns null

export function PRINT(...anything: any): void {
  console.log(anything);
}

export function ERROR(...anything: any): void {
  throw new Error(anything);
}

export function DEBUG(...anything: any): void {
  console.log("DEBUG", anything);
}

export function UpdateProgressBar(percentage: string): void {
  let progress_bar = $("#bar");
  progress_bar.css("width", percentage);
}

// Assertions to ensure that certain conditions or
// assumptions hold true
export function assert(condition: unknown, msg: string): asserts condition {
  if (condition === false) throw new Error("Assertion: " + msg);
}

// CheckIfImageIsValidForThisDevice
export function CheckIfImageIsCompatibleForThisDevice(device_name: string, image: FirmwareFile) {
  const decoder: TextDecoder = new TextDecoder("utf-8");
  const text: string = decoder.decode(image.FirmwareBytes);
  DEBUG();

  // if image doesn't include
  if (!text.toLowerCase().includes(device_name.toLowerCase()))
    ERROR("This image is not compatible with this device");
}
