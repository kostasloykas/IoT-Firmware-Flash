import { DEBUG, FirmwareFile, PRINT, UpdateProgressBar, ERROR, Packet, assert, NRFZIP } from "./classes";
import crc32 from "crc-32";
import { Buffer } from "buffer";
import { NRF_DONGLE_Interface } from "./interfaces";
import * as usb from "./web_usb";

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

  static decode_add_byte(
    c: number,
    decoded_data: Array<number>,
    current_state: number
  ): [boolean, number, Array<number>] {
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

export class NRF_DONGLE implements NRF_DONGLE_Interface {
  port: any = null;
  writer: any = null;
  reader: any = null;
  filters: object = {
    dataBits: 8,
    baudRate: 115200, // 115200
    stopbits: 1,
    parity: "none",
    flowControl: "none",
  };
  MTU: number = null;
  PRN: number = null;
  needs_to_trigger_bootloader: boolean = null;
  DFU_DETACH_REQUEST: number = 0x00;

  constructor(trigger_bootloader: boolean) {
    this.needs_to_trigger_bootloader = trigger_bootloader;
  }

  public async FlashFirmware(port: any, zip_file: NRFZIP) {
    let init_packet: Uint8Array;
    let image: FirmwareFile;

    PRINT("Extracting files from zip");
    [image, init_packet] = await zip_file.ExtractFirmwareAndInitPacket();
    PRINT("Files extracted");

    this.port = port;

    // trigger bootloader if needs
    if (this.needs_to_trigger_bootloader) {
      PRINT("Try to Trigger Bootloader");
      await this.TriggerBootloader()
        .then((result) => {
          PRINT("Bootloader Triggered");
        })
        .catch((err) => {
          ERROR(err);
        });

      PRINT("Now i want again serial access to the device in order to start flashing");

      // FIXME: create a button and request access to port of device
      // createTemporaryRequestPortButton
      // click

      const usbVendorId: number = 0x1915;
      const usbProductId: number = 0x521f;

      await navigator.serial.requestPort({ filters: [{ usbVendorId, usbProductId }] }).then((port_: any) => {
        this.port = port_;
      });
    }

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

    PRINT("Try to get MTU");
    await this.GetMTU()
      .then((mtu) => {
        this.MTU = mtu;
        PRINT("MTU is", mtu);
      })
      .catch((err) => ERROR("GetMTU", err));

    PRINT("Try to Set Receipt Notification");
    await this.SetReceiptNotification()
      .then(() => PRINT("Receipt Notification set successfully"))
      .catch((err) => ERROR("SetReceiptNotification", err));

    UpdateProgressBar("20%");

    //Transfer Init Packet
    PRINT("Try to transfer Init Packet");
    await this.TransferInitPacket(init_packet)
      .then(() => {
        PRINT("Init Packet Transferred successfully");
      })
      .catch((err) => ERROR("TransferInitPacket", err));

    UpdateProgressBar("40%");

    //Transfer Firmware
    PRINT("Try to transfer Firmware");
    await this.TransferFirmware(image.FirmwareBytes)
      .then(() => PRINT("Firmware transferred successfully"))
      .catch((err) => ERROR("TransferFirmware", err));
    UpdateProgressBar("90%");

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

  async GetDfuInterfaceNumber(device: any): Promise<number> {
    const interfaces = device.configuration.interfaces;
    DEBUG(interfaces);

    if (device.configuration == null) return null;

    for (let interface_iter of interfaces) {
      if (
        interface_iter.alternate.interfaceClass == 255 &&
        interface_iter.alternate.interfaceSubclass == 1 &&
        interface_iter.alternate.interfaceProtocol == 1
      )
        return interface_iter.interfaceNumber;
    }

    return null;
  }

  async TriggerBootloader() {
    const filters: any = [{ vendorId: 0x1915, productId: 0x520f }];
    let device: any = null;
    let interface_number: number = null;

    // request usb device
    await usb
      .RequestDevice(filters)
      .then((usbDevice) => (device = usbDevice))
      .catch((err) => {
        ERROR("TriggerBootloader", err);
      });

    assert(device != null, "Device must be != null");

    // open port
    await device.open();

    // get dfu interface number
    await this.GetDfuInterfaceNumber(device)
      .then((interface_num) => {
        if (interface_num == null) ERROR("Can't find DFU interface");
        interface_number = interface_num;
      })
      .catch((err) => ERROR("TriggerBootloader", err));

    assert(interface_number != null, "Interface number must be != null");

    // claim dfu interface
    await device.claimInterface(interface_number).catch((err: any) => ERROR("TriggerBootloader", err));

    const arr: Uint8Array = new TextEncoder().encode("0");

    const setup = {
      requestType: "class",
      recipient: "interface",
      request: this.DFU_DETACH_REQUEST,
      value: 0,
      index: interface_number,
    };

    // send request to trigger bootloader
    await device.controlTransferOut(setup, arr).catch((err: any) => {});

    // // release interface
    // await device.releaseInterface(interface_number);

    // // close port
    // await device.close();
  }

  // TransferFirmware
  async TransferFirmware(firmware: Uint8Array) {
    let max_size: number = null;
    let crc: number = null;

    await this.Select(0x02)
      .then(([remote_max_size, remote_offset, remote_CRC32]) => {
        PRINT("Max size", remote_max_size, "Offset", remote_offset, "CRC32", remote_CRC32);
        max_size = remote_max_size;
        crc = remote_CRC32;
      })
      .catch((err) => ERROR("TransferFirmware", err));

    assert(max_size != null, "max size must be != null");
    assert(crc != null, "max size must be != null");

    // Send Firmware
    for (let offset = 0; offset < firmware.length; offset += max_size) {
      // create command
      let data: Uint8Array = firmware.slice(offset, offset + max_size);

      await this.Create(data.length, 0x02).catch((err) => ERROR("TransferFirmware", err));

      // send data
      crc = (await this.SendData(data, crc, offset).catch((err) => ERROR("TransferFirmware", err))) as number;

      // execute command
      await this.Execute().catch((err) => ERROR("TransferFirmware", err));
    }
  }

  // Select
  async Select(type: number): Promise<[max_size: number, offset: number, CRC32: number]> {
    let max_size: number = null;
    let offset: number = null;
    let CRC32: number = null;

    // select command
    let opSelect: Uint8Array = Slip.encode(new Uint8Array([OP_CODE.Select, type]));

    // send select command
    await this.Write(opSelect).catch((err) => {
      ERROR("Select:", err);
    });

    // get response and check if the command executed successfully
    await this.GetResponse(OP_CODE.Select)
      .then((data) => {
        assert(data.length == 12, "length of response data of select command must be 12 bytes");

        const ExtractSizeOffsetCRC32 = (
          data: Uint8Array
        ): [max_size: number, offset: number, CRC32: number] => {
          const dataView = new DataView(data.buffer);
          const max_size = dataView.getUint32(0, true);
          const offset = dataView.getUint32(4, true);
          const CRC32 = dataView.getUint32(8, true);
          return [max_size, offset, CRC32];
        };

        // extract data
        [max_size, offset, CRC32] = ExtractSizeOffsetCRC32(data);
      })
      .catch((err) => ERROR("Select:", err));

    assert(max_size != null, "max_size must be != null");
    assert(offset != null, "offset must be != null");
    assert(CRC32 != null, "CRC32 must be != null");

    return [max_size, offset, CRC32];
  }

  // WriteCommand
  async WriteCommand(data: Uint8Array) {
    // write command
    let opWRITE: Uint8Array = Slip.encode(new Uint8Array([OP_CODE.Write, ...data]));

    // send command
    await this.Write(opWRITE).catch((err) => {
      ERROR("WriteCommand:", err);
    });
  }

  // SendData
  async SendData(data: Uint8Array, crc = 0, offset = 0): Promise<number> {
    const validate_crc = (crc1: number, crc2: number, offset1: number, offset2: number) => {
      if (crc1 != crc2) ERROR("Failed CRC validation");
      if (offset1 != offset2) ERROR("Failed offset validation");
    };

    let current_prn: number = 0;

    // send data
    for (let start = 0; start < data.length; start += this.MTU) {
      const to_transfer: Uint8Array = data.slice(start, start + this.MTU);

      await this.WriteCommand(to_transfer).catch((err) => ERROR("SendData", err));

      crc = crc32.buf(to_transfer, crc) >>> 0;

      offset += to_transfer.length;
      current_prn++;

      // validate crc
      if (current_prn == this.PRN) {
        let remote_offset: number, remote_crc: number;

        current_prn = 0;
        this.GetResponse(OP_CODE.CRC)
          .then((response) => {
            assert(response.length == 8, "Data must be 8 bytes");

            const ExtractOffsetCRC = (data: Uint8Array): [offset: number, CRC32: number] => {
              const dataView = new DataView(data.buffer);
              const offset = dataView.getUint32(0, true);
              const CRC = dataView.getUint32(4, true);
              return [offset, CRC];
            };

            // extract data
            [remote_offset, remote_crc] = ExtractOffsetCRC(response);
          })
          .catch((err) => ERROR("SendData", err));
        validate_crc(crc, remote_crc, offset, remote_offset);
      }
    }

    // crc command
    await this.CRC()
      .then(([remote_crc, remote_offset]) => {
        validate_crc(crc, remote_crc, offset, remote_offset);
      })
      .catch((err) => ERROR("SendData", err));

    return crc;
  }

  // number to little-endian format
  number_to_litle_endian_format(num: number): number[] {
    const value: Buffer = Buffer.alloc(4); // 4 bytes for unsigned long integer
    value.writeUInt32LE(num, 0); // Write the size as a little-endian unsigned long integer

    return Array.from(value);
  }

  // TransferInitPacket
  async TransferInitPacket(init_packet: Uint8Array) {
    let remote_max_size: number = null;
    let remote_offset: number = null;
    let remote_CRC32: number = null;

    await this.Select(0x01)
      .then(([max_size, offset, CRC32]) => {
        PRINT("Max size", max_size, "Offset", offset, "CRC32", CRC32);
        remote_max_size = max_size;
        remote_offset = offset;
        remote_CRC32 = CRC32;
      })
      .catch((err) => ERROR("TransferInitPacket", err));

    if (init_packet.length > remote_max_size) ERROR("Init Packet is too long");

    // ============= NOT IMPLEMENTED =================

    // // check if the specific init packet is already in the device
    // const needs_to_transfer_again_init_packet: boolean = this.CheckIfNeedsToTransferInitPacketIntoDevice(
    //   remote_offset,
    //   remote_CRC32,
    //   init_packet
    // );

    // // if doesn't need to transfer again the init packet then return
    // if (!needs_to_transfer_again_init_packet) return;

    // ================================================

    // Send Init Packet

    // create command
    await this.Create(init_packet.length, 0x01).catch((err) => ERROR("TransferInitPacket", err));

    // send data
    await this.SendData(init_packet).catch((err) => ERROR("TransferInitPacket", err));

    // execute command
    await this.Execute().catch((err) => ERROR("TransferInitPacket", err));
  }

  // GetResponse
  async GetResponse(operation: number): Promise<Uint8Array> {
    let packet: Uint8Array = null;
    await this.GetPacket()
      .then((_packet) => (packet = _packet))
      .catch((err) => ERROR("GetResponse", err));

    assert(packet != null, "Packet must be != null");

    if (packet[0] != OP_CODE.Response) ERROR("No response");
    if (packet[1] != operation)
      ERROR("Unexpected Executed OP_CODE: Expected ", operation, " Came ", packet[1]);
    if (packet[2] != RES_CODE.Success) ERROR("Command didn't succeed");

    // return the data only
    return packet.slice(3);
  }

  // GetPacket
  async GetPacket(): Promise<Uint8Array> {
    let current_state = Slip.SLIP_STATE_DECODING;
    let finished = false;
    let decoded_data: Array<number> = new Array<number>();
    let byte: number;

    // start creating packet
    while (!finished) {
      //read 1 byte
      await this.ReadInto(new ArrayBuffer(1))
        .then((buffer) => (byte = buffer[0]))
        .catch((err) => ERROR("GetPacket", err));

      // decode every byte
      [finished, current_state, decoded_data] = Slip.decode_add_byte(byte, decoded_data, current_state);
    }

    return Uint8Array.from(decoded_data);
  }

  ProtocolVersion(...params: any): void {
    throw new Error("Method not implemented.");
  }

  // Create
  async Create(size: number, type: number) {
    // create command
    let opCREATE: Uint8Array = Slip.encode(
      new Uint8Array([OP_CODE.Create, type, ...this.number_to_litle_endian_format(size)])
    );

    // send command
    await this.Write(opCREATE).catch((err) => {
      ERROR("Create:", err);
    });

    // get response and check if the command executed successfully
    await this.GetResponse(OP_CODE.Create).catch((err) => ERROR("Create", err));
  }

  // SetReceiptNotification
  // Before the actual DFU process can start, the DFU controller must set the Packet Receipt Notification (PRN)
  // value and obtain the maximum transmission unit (MTU)
  async SetReceiptNotification() {
    // prn command
    // validation every 256 sended packets
    this.PRN = 256;
    let opPRN: Uint8Array = Slip.encode(new Uint8Array([OP_CODE.SetPacketReceiptNotification, 0x00, 0x01]));

    // send command
    await this.Write(opPRN).catch((err) => {
      ERROR("SetReceiptNotification:", err);
    });

    // get response and check if the command executed successfully
    await this.GetResponse(OP_CODE.SetPacketReceiptNotification).catch((err) =>
      ERROR("SetReceiptNotification", err)
    );
  }

  // CRC
  async CRC(): Promise<[crc: number, offset: number]> {
    let crc: number = null,
      offset: number = null;

    // crc command
    let opCRC: Uint8Array = Slip.encode(new Uint8Array([OP_CODE.CRC]));

    // send command
    await this.Write(opCRC).catch((err) => {
      ERROR("CRC", err);
    });

    // get response and check if the command executed successfully
    await this.GetResponse(OP_CODE.CRC)
      .then((data) => {
        assert(data.length == 8, "Data must be 8 bytes");

        const ExtractOffsetCRC = (data: Uint8Array): [offset: number, CRC32: number] => {
          const dataView = new DataView(data.buffer);
          const offset = dataView.getUint32(0, true);
          const CRC = dataView.getUint32(4, true);
          return [offset, CRC];
        };

        // extract data
        [offset, crc] = ExtractOffsetCRC(data);
      })
      .catch((err) => ERROR("CRC", err));

    assert(offset, "offset must be != null");
    assert(crc, "crc must be != null");

    return [crc, offset];
  }

  // Execute
  async Execute() {
    // execute command
    let opEXECUTE: Uint8Array = Slip.encode(new Uint8Array([OP_CODE.Execute]));

    // send command
    await this.Write(opEXECUTE).catch((err) => {
      ERROR("Execute:", err);
    });

    // get response and check if the command executed successfully
    await this.GetResponse(OP_CODE.Execute).catch((err) => ERROR("Execute", err));
  }

  // GetMTU
  async GetMTU(): Promise<number> {
    let opMTU: Uint8Array = Slip.encode(new Uint8Array([OP_CODE.GetMTU]));
    let mtu: number = null;
    // send command
    await this.Write(opMTU).catch((err) => ERROR("GetMTU:", err));

    // wait for response
    await this.GetResponse(OP_CODE.GetMTU)
      .then((data) => {
        // maximum data size that can be sent is (MTU/2) - 2

        // convert data in little endian format in order to obtain mtu
        const ConvertInLittleEndianFormat = (data: Uint8Array): number => {
          const dataView = new DataView(data.buffer);
          const mtu = dataView.getUint16(0, true);
          return mtu;
        };

        mtu = Math.floor(ConvertInLittleEndianFormat(data) - 1) / 2 - 1;
      })
      .catch((err) => ERROR("GetMTU", err));

    assert(mtu != null, "mtu must be != null");

    return mtu;
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
