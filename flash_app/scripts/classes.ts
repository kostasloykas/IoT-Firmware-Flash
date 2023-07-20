/* classes.ts */
import $ from "jquery";
import crc32 from "crc-32";
import sha256, { x2 } from "sha256";
import MemoryMap, * as intel from "./intel-hex.js";
import AdmZip from "adm-zip";
import { Buffer } from "buffer";

declare global {
  interface Navigator {
    serial: any;
    usb: any;
  }
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
  private size: number = 0;
  private crc32: number = null;

  //we have 2 constructors
  constructor(input_element: HTMLInputElement, type: string);
  constructor(bytes: Uint8Array, type: string);
  constructor(...param: any[]) {
    assert(param.length == 2, "Constructor accepts only two parameters");
    let type: string = param[1];
    let input_element: HTMLInputElement = param[0];
    let bytes: Uint8Array = param[0];

    // HTMLInputElement constructor
    if (type == "HTMLInputElement") this.constructorInputElement(input_element);
    // Uint8Array constructor
    else if (type == "Uint8Array") this.constructorUint8Array(bytes);
    else assert(0, "Unrecognized type");
  }

  public constructorInputElement(input_element: HTMLInputElement) {
    CheckFileExtention(input_element.files[0].name);
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

  public constructorUint8Array(bytes: Uint8Array) {
    this.firmware_bytes = bytes;
    this.size = this.firmware_bytes.length;
    this.CalculateCRC32();
    this.ComputeHash(this.firmware_bytes);
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

  // Convert firmware to bytes
  private async ConvertFirmwareToBytes(input_element: HTMLInputElement): Promise<Uint8Array> {
    return await new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();
      let file = input_element.files[0];
      let type: string = file.name.split(".").pop();

      reader.onerror = function (event) {
        reject(new Error("Error reading file."));
      };

      // read hex file
      if (type == "hex") {
        reader.onload = function (event) {
          let hexdata: string = event.target?.result as string;
          let memMap: MemoryMap = MemoryMap.fromHex(hexdata); //convert hexdata to binary
          let bytes: Uint8Array = new Uint8Array();

          // add padding
          bytes = ConvertBinaryToUint8Array(bytes, memMap);

          assert(bytes.length != 0, "Bytes length must be != 0");
          resolve(bytes);
        };
        reader.readAsText(file);

        // read bin file
      } else if (type == "bin") {
        reader.onload = function (event) {
          const result = event.target?.result as ArrayBuffer;
          let bytes: Uint8Array = new Uint8Array(result);
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

export class ZipFile {
  private zip_file: AdmZip = null;
  private zip_size: number = 0;
  private firmware: FirmwareFile = null;
  private init_packet: Uint8Array = null;
  private json: any = null; //json file

  public constructor(input_element: HTMLInputElement) {
    CheckFileExtention(input_element.files[0].name);
    this.ConvertZipFileToBytes(input_element)
      .then((bytes) => {
        this.zip_file = new AdmZip(Buffer.from(bytes));
        this.zip_size = bytes.length;
      })
      .catch((err) => ERROR("constructor ZipFile", err));
  }

  // Convert zip file to bytes
  private async ConvertZipFileToBytes(input_element: HTMLInputElement): Promise<Uint8Array> {
    return await new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();
      let file = input_element.files[0];
      let type: string = file.name.split(".").pop();

      // on error
      reader.onerror = function (event) {
        reject(new Error("Error reading file."));
      };

      // read zip file
      if (type == "zip") {
        reader.onload = function (event) {
          const result = event.target?.result as ArrayBuffer;
          let bytes: Uint8Array = new Uint8Array(result);
          resolve(bytes);
        };

        reader.readAsArrayBuffer(file);
      } else ERROR("Unknown type of input file");
    });
  }

  // ExtractFirmwareInitPacket
  public async ExtractFirmwareAndInitPacket(): Promise<[firmware: FirmwareFile, init_packet: Uint8Array]> {
    assert(this.zip_file != null, "Zip file must be != null");

    // extract firmware and init packet
    this.zip_file.forEach((entry) => {
      const name: string = entry.name;
      const extention: string = name.split(".").pop();
      const data: Uint8Array = Uint8Array.from(entry.getData());

      // bin file
      if (extention == "bin") this.firmware = new FirmwareFile(data, "Uint8Array");
      // dat file
      else if (extention == "dat") this.init_packet = data;
      //json file
      else if (extention == "json") {
        const json_file: string = new TextDecoder().decode(data);
        this.json = JSON.parse(json_file);
      }
    });

    assert(this.firmware != null, "firmware must be != null");
    assert(this.init_packet != null, "init packet must be != null");
    assert(this.json != null, "manifest must be != null");

    // check if this image is for application update of nrf device
    if (this.json.manifest.application == null) ERROR("This image doesn't update application image");

    // return firmware and init packet
    return [this.firmware, this.init_packet];
  }

  // this is firmware size
  public get Size(): number {
    return this.zip_size;
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

export const ACK = 0xcc;
export const NACK = 0x33;

export enum FILE_EXTENTION {
  HEX = "hex",
  BIN = "bin",
  ZIP = "zip",
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
export function CheckIfImageIsCompatibleForThisDevice(devices: string[], image: FirmwareFile) {
  const decoder: TextDecoder = new TextDecoder("utf-8");
  //take only numbers and letters
  const text: string = decoder.decode(
    image.FirmwareBytes.filter(
      (value, i, arr) =>
        (arr[i] >= 65 && arr[i] <= 90) || (arr[i] >= 48 && arr[i] <= 57) || (arr[i] >= 97 && arr[i] <= 122)
    )
  );

  for (const device_name of devices) {
    if (text.toLowerCase().includes(device_name.toLowerCase())) return;
  }
  // if image doesn't include any keyword
  ERROR("This image is not compatible with this device");
}

function ConvertBinaryToUint8Array(bytes: Uint8Array, memMap: MemoryMap): Uint8Array {
  // iterator
  let iterator: IterableIterator<number> = memMap.keys() as IterableIterator<number>;
  iterator.next().value;

  // add padding and return the Uint8Array
  for (let [address, dataBlock] of memMap) {
    // console.log("Data block at ", address, ", bytes: ", dataBlock);
    let size_of_data: number = (<Uint8Array>dataBlock).length;
    let padding_start: number = address + size_of_data;
    let padding_end: number = iterator.next().value;
    let padding_needs: boolean = padding_end != null ? true : false;
    let padding: Uint8Array = new Uint8Array(Math.abs(padding_end - padding_start - 1)).fill(0xff);
    let bytes_length: number = bytes.length;
    let tmp_bytes: Uint8Array = bytes;

    if (padding_needs) {
      bytes = new Uint8Array(bytes_length + size_of_data + padding.length + 1);
      bytes.set(tmp_bytes);
      bytes.set(dataBlock, bytes_length);
      bytes.set(padding, bytes_length + size_of_data);
    } else {
      bytes = new Uint8Array(bytes_length + size_of_data);
      bytes.set(tmp_bytes);
      bytes.set(dataBlock, bytes_length);
    }
  }
  return bytes;
}

// Check file extention
function CheckFileExtention(name: string): void {
  let extention: string = name.split(".").pop().toUpperCase();
  if (!(extention in FILE_EXTENTION)) ERROR("File extention is not supported");
}
