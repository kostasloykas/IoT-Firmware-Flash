import {
  ACK,
  DEBUG,
  ERROR,
  FirmwareFile,
  NACK,
  PRINT,
  Packet,
  RESPOND,
  assert,
  Command,
  UpdateProgressBar,
} from "./library";

enum VERSION_CC2538 {
  _512_KB,
  _256_KB,
  _128_KB,
}

// To encode data before send them to device
class Encoder {
  public encode(data: number[]): Uint8Array {
    // check if data contains numbers greater than 1 byte
    assert(() => {
      for (let num of data) {
        if (num > 2 ** 8) return false;
      }
      return true;
    }, "Encoder: Numbers must be <= 1 byte");

    const encodedData = new Uint8Array(data);
    return encodedData;
  }

  // encodes the address in the MSB
  public encode_addr(address: number): number[] {
    assert(address <= 2 ** 32, "Encoder: number must be <= 4 byte");
    let byte4: number = (address >> 0) & 0xff;
    let byte3: number = (address >> 8) & 0xff;
    let byte2: number = (address >> 16) & 0xff;
    let byte1: number = (address >> 24) & 0xff;
    return [byte1, byte2, byte3, byte4];
  }
}

export class CC2538 implements Command {
  version: VERSION_CC2538;
  port: any;
  writer: any;
  reader: any;
  encoder: Encoder;
  filters: object = {
    dataBits: 8,
    baudRate: 115200, //maximum 460800 , 115200
    stopbits: 1,
    parity: "none",
    flowControl: "none", // Hardware flow control using the RTS and CTS signals is enabled.
  };
  CHIP_ID: number[] = [0xb964, 0xb965];
  start_address: number = 0x00200000; //start address of flash memory
  start_address_write: number = 0x00202000; //start address for writing the image
  FLASH_CTRL_DIECFG0: number = 0x400d3014;

  // FlashFirmware
  async FlashFirmware(port: any, image: FirmwareFile) {
    this.port = port;
    this.encoder = new Encoder();

    // check if image is compatible with this device
    this.CheckIfImageIsCompatibleForThisDevice("cc2538", image);

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

    PRINT("Try to invoke bootloader");
    await this.InvokeBootloader() //Invoke bootloader
      .catch((err) => {
        ERROR("Invoke bootloader:", err);
      })
      .then(() => {
        PRINT("Bootloader Invoked");
      });
    UpdateProgressBar("20%");

    //  initialize buffers
    this.reader = this.port.readable.getReader({ mode: "byob" });
    this.writer = this.port.writable.getWriter();

    PRINT("Try to Synch");
    await this.SendSync()
      .then(() => {
        PRINT("Synchronized");
      })
      .catch((err) => {
        ERROR("SendSynch:", err);
      });

    PRINT("Try to get Chip Id");
    await this.GetChipID()
      .then((chip_id) => {
        PRINT("The Chip Id of device is ", chip_id.toString(16));
      })
      .catch((err) => {
        ERROR("GetChipID:", err);
      });
    UpdateProgressBar("30%");

    PRINT("Try to find informations about device");
    // await this.FlashSizeOfFlashMemory();

    return;

    // await this.IsBootloaderEnabled()
    //   .then((is_enabled: boolean) => {
    //     if (is_enabled) PRINT("Bootloader is enabled");
    //     else PRINT("Bootloader is disabled");
    //   })
    //   .catch((err) => ERROR("IsBootloaderEnabled", err));

    // await this.IsImageValid()
    //   .then((is_valid: boolean) => {
    //     if (is_valid) PRINT("Image is valid");
    //     else PRINT("Image is not valid");
    //   })
    //   .catch((err) => ERROR("IsImageValid", err));
    // UpdateProgressBar("50%");

    // PRINT("Try to configure CCA");
    // this.ConfigureCCA();
    // PRINT("CCA configured");

    PRINT("Try to Erase flash memory");
    //  FIXME: to number allakse
    await this.Erase(this.start_address, 524288)
      .then(() => PRINT("Erase Done"))
      .catch((err) => ERROR("Erase:", err));
    UpdateProgressBar("60%");

    PRINT("Try to write image in flash");
    await this.WriteFlash(this.start_address_write, image.FirmwareBytes)
      .then(() => {
        PRINT("Image succesfully written to flash");
      })
      .catch((err) => {
        ERROR("WriteFlash:", err);
      });
    UpdateProgressBar("70%");

    PRINT("Try to verify firmware");
    await this.Verify(this.start_address_write, image)
      .then(() => PRINT("Firmware verified"))
      .catch((err) => ERROR("Verify:", err));
    UpdateProgressBar("80%");

    PRINT("Try to reset device");
    await this.Reset()
      .then(() => PRINT("Device has been reset"))
      .catch((err) => ERROR("Reset", err));
    UpdateProgressBar("90%");

    await this.ClosePort()
      .then(() => PRINT("Port closed successfully"))
      .catch((err) => ERROR("Port can't be closed ", err));
    UpdateProgressBar("100%");

    return;
  }

  // TODO:IsBootloaderEnabled
  async IsBootloaderEnabled(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  // TODO:IsImageValid
  async AreImageBitsValid(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  // FIXME:FlashSize
  async FlashSizeOfFlashMemory() {
    throw new Error("Method not implemented.");
  }

  // Verify
  async Verify(address: number, image: FirmwareFile) {
    let crc32_local: number = image.CRC32;
    let crc32_remote: number = null;
    await this.CRC32(address, image.Size)
      .then((crc32: number) => {
        crc32_remote = crc32;
      })
      .catch((err) => {
        ERROR("Verify:", err);
      });

    assert(crc32_remote != null, "crc32_remote must be != null");

    PRINT("local_crc=", crc32_local, "remote_crc=", crc32_remote);
    if (crc32_local != crc32_remote) ERROR("crc32_local != crc32_remote");
  }

  // invoke bootloader
  async InvokeBootloader() {
    await this.port.setSignals({ dataTerminalReady: true, requestToSend: false });
    await this.port.setSignals({ requestToSend: true });
    await this.port.setSignals({ requestToSend: false });
    await new Promise((resolve) => setTimeout(resolve, 10)); // Wait for some time
    await this.port.setSignals({ dataTerminalReady: false });
    await new Promise((resolve) => setTimeout(resolve, 50)); // Wait for some time
  }

  // Open port
  async OpenPort() {
    await this.port.open(this.filters);
  }
  // ClosePort
  async ClosePort() {
    await this.reader.releaseLock();
    await this.writer.releaseLock();
    await this.port.close();
  }

  //   TODO:
  ConfigureCCA(): void {}

  // CheckIfImageIsValidForThisDevice
  CheckIfImageIsCompatibleForThisDevice(device_name: string, image: FirmwareFile) {
    const decoder: TextDecoder = new TextDecoder("utf-8");
    const text: string = decoder.decode(image.FirmwareBytes);

    // if image doesn't include
    if (!text.includes(device_name)) ERROR("This image is not compatible with this device");
  }

  // WriteFlash
  async WriteFlash(address: number, image: Uint8Array) {
    address = 0x00202000;
    let from: number = 0;
    let to: number = from + 252;
    let remain_data_to_be_transfered: number = image.length;
    let download_needs: boolean = true;

    // TODO: Check Backdoor of image

    // in order to skip empty data
    let empty_data = new Uint8Array(252).fill(0xff);

    while (true) {
      let data: Uint8Array = image.slice(from, to); //take data (from-to)
      // send maximum 252 data
      assert(data.length <= 252, "length must be <= 252");

      // if data finished break
      if (data.length == 0) break;

      let are_equal: boolean = data.every((element, index) => element == empty_data[index]);

      // start flashing
      if (!are_equal) {
        if (download_needs) {
          // download
          await this.Download(address, remain_data_to_be_transfered).catch((err) => {
            ERROR("WriteFlash", err);
          });
          download_needs = false;
        }
        // send data
        await this.SendData(data).catch((err) => {
          ERROR("WriteFlash", err);
        });
      } else {
        download_needs = true;
      }

      from += 252;
      to += 252;
      address += 252;
      remain_data_to_be_transfered -= 252;
    }
  }

  //   TODO: MemoryRead
  MemoryRead(...params: any): void {
    throw new Error("Method not implemented.");
  }

  async SendAck() {
    let ack: Uint8Array = new Uint8Array([0x00, ACK]);
    await this.Write(ack);
  }
  async SendNAck() {
    let nack: Uint8Array = new Uint8Array([0x00, NACK]);
    await this.Write(nack);
  }
  // Receive Packet
  // @returns {null if checksum wasn't valid} or {Packet} .
  async ReceivePacket(): Promise<Packet> {
    let size: number;
    let checksum: number;
    let data: Uint8Array;

    // read size and checksum
    // here needs to wait in case crc32 response wait
    await this.ReadInto(new ArrayBuffer(2))
      .then((buffer) => {
        size = buffer[0];
        checksum = buffer[1];
      })
      .catch((err) => {
        ERROR("ReceivePacket:", err);
      });

    await this.ReadInto(new ArrayBuffer(size - 2))
      .then((buffer) => {
        data = buffer;
      })
      .catch((err) => {
        ERROR("ReceivePacket:", err);
      });

    let packet: Packet = new Packet(data);

    if (packet.Checksum !== checksum) {
      this.SendNAck();
      return null;
    } else {
      this.SendAck();
      return packet;
    }
  }

  // Send Sync
  async SendSync() {
    let data: Uint8Array = this.encoder.encode([0x55]);

    await this.Write(data)
      .then(() => {
        PRINT("Send 0x55");
      })
      .catch((err) => {
        ERROR("SendSynch", err);
      });

    await this.Write(data)
      .then(() => {
        PRINT("Send 0x55");
      })
      .catch((err) => {
        ERROR("SendSynch", err);
      });

    // wait for ack
    await this.WaitForAck()
      .then((response) => {
        assert(response == ACK, "response must be ACK");
      })
      .catch((err) => {
        ERROR("SendSynch wait for ACK/NACK", err);
      });
  }

  // Wait for ack
  async WaitForAck(time_to_wait: number = 100): Promise<number> {
    let data: Uint8Array = null;
    await this.ReadInto(new ArrayBuffer(2), time_to_wait) //read 2 bytes
      .then((array) => (data = array))
      .catch((err) => {
        ERROR("WaitForAck", err);
      });

    if (data[0] == 0x00 && data[1] == ACK) return ACK;
    else if (data[0] == 0x00 && data[1] == NACK) return NACK;

    throw Error("Unrecognized response (neither ACK nor NACK)");
  }

  // CRC32
  async CRC32(start_address: number, number_of_bytes: number): Promise<number> {
    let crc32_remote: number = null;
    let addr = this.encoder.encode_addr(start_address);
    let size = this.encoder.encode_addr(number_of_bytes);
    let data: Uint8Array = this.encoder.encode([
      0x27, //command
      addr[0],
      addr[1],
      addr[2],
      addr[3],
      size[0],
      size[1],
      size[2],
      size[3],
    ]);
    let packet: Packet = new Packet(data);

    // write packet
    await this.Write(packet).catch((err) => {
      ERROR("CRC32:", err);
    });

    // wait for ack 5 seconds
    await this.WaitForAck(5000)
      .then((response: number) => {
        assert(response == ACK, "response must be ACK");
      })
      .catch((err) => {
        ERROR("CRC32:", err);
      });

    // receive packet
    await this.ReceivePacket()
      .then((packet: Packet) => {
        if (packet == null) throw new Error("Packet was corrupted");
        // decode crc32
        crc32_remote = ((packet.Data[0] << 24) |
          (packet.Data[1] << 16) |
          (packet.Data[2] << 8) |
          (packet.Data[3] << 0)) as number;
      })
      .catch((err) => ERROR("CRC32:", err));

    this.CheckIfStatusIsSuccess(await this.GetStatus());

    assert(crc32_remote != null, "crc32 from device must be != null");
    return crc32_remote;
  }

  // SendData
  async SendData(data: Uint8Array) {
    assert(data.length <= 252, "Data must be <= 252, the size is ".concat(data.length.toString()));
    // create the array that contains command number and the data
    let array: Uint8Array = new Uint8Array(data.length + 1); //253 bytes
    array.set(data, 1);
    array[0] = 0x24;
    let packet = new Packet(array);

    await this.Write(packet).catch((err) => {
      ERROR("SendData:", err);
    });

    await this.WaitForAck()
      .then((res: number) => {
        if (res == NACK) ERROR("Nack came in SendData function");
      })
      .catch((err) => {
        ERROR("SendData:", err);
      });

    this.CheckIfStatusIsSuccess(await this.GetStatus());
  }

  // Download
  async Download(start_address: number, size_of_data: number) {
    assert(size_of_data % 4 == 0, "Size must be multiple of 4");
    let addr = this.encoder.encode_addr(start_address);
    let size = this.encoder.encode_addr(size_of_data);
    let data: Uint8Array = this.encoder.encode([
      0x21,
      addr[0],
      addr[1],
      addr[2],
      addr[3],
      size[0],
      size[1],
      size[2],
      size[3],
    ]);
    let packet: Packet = new Packet(data);

    await this.Write(packet).catch((err) => {
      ERROR("Download:", err);
    });

    await this.WaitForAck()
      .then((response: number) => {
        assert(response == ACK, "response must be ACK");
      })
      .catch((err) => {
        ERROR("Download:", err);
      });

    this.CheckIfStatusIsSuccess(await this.GetStatus());
  }

  // doesn't need to implement
  Run(): void {
    throw new Error("Method not implemented.");
  }

  // Get status
  async GetStatus(): Promise<number> {
    let data: Uint8Array = this.encoder.encode([0x23]);
    let packet: Packet = new Packet(data);
    let response: number = null;

    await this.Write(packet).catch((err) => {
      ERROR("GetStatus:", err);
    });

    await this.WaitForAck()
      .then((response: number) => {
        assert(response == ACK, "response must be ACK");
      })
      .catch((err) => {
        ERROR("GetStatus:", err);
      });

    await this.ReceivePacket()
      .then((packet: Packet) => {
        if (packet == null) throw new Error("Packet was corrupted");
        else response = packet.Data[0];
      })
      .catch((err) => {
        ERROR("GetStatus:", err);
      });

    assert(response != null, "response must be != null");
    return response;
  }

  // Check status
  CheckIfStatusIsSuccess(status: number): void {
    if (status != RESPOND.COMMAND_RET_SUCCESS) {
      ERROR("GetStatus is unsuccessful with status ", status);
    }
  }

  async MemoryWrite(...params: any) {
    throw new Error("Method not implemented.");
  }
  // Ping
  Ping(): void {
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

  // Reset
  async Reset() {
    let data: Uint8Array = this.encoder.encode([0x25]);
    let packet: Packet = new Packet(data);

    await this.Write(packet).catch((err) => {
      ERROR("Reset:", err);
    });

    // wait for ack
    await this.WaitForAck()
      .then((response) => {
        assert(response == ACK, "response must be ACK");
      })
      .catch((err) => {
        ERROR("Reset", err);
      });
  }

  async Erase(addr: number, number_of_bytes_to_be_erased: number) {
    let address = this.encoder.encode_addr(addr);
    let size = this.encoder.encode_addr(number_of_bytes_to_be_erased);
    let data: Uint8Array = this.encoder.encode([
      0x26,
      address[0],
      address[1],
      address[2],
      address[3],
      size[0],
      size[1],
      size[2],
      size[3],
    ]);
    let packet: Packet = new Packet(data);

    await this.Write(packet).catch((err) => {
      ERROR("EraseMemory:", err);
    });

    // wait maximum 10 seconds
    await this.WaitForAck(10000)
      .then((response: number) => {
        assert(response == ACK, "response must be ACK");
      })
      .catch((err) => {
        ERROR("EraseMemory:", err);
      });

    this.CheckIfStatusIsSuccess(await this.GetStatus());
  }

  // Get Chip Id
  // @returns {number of chip id}
  async GetChipID(): Promise<number> {
    // create command
    let packet: Packet = new Packet(new Uint8Array([0x28]));
    let chip_id: number = null;
    // write packet
    await this.Write(packet).catch((err) => {
      ERROR("GetChipID", err);
    });

    // wait for ACK
    await this.WaitForAck()
      .then((response) => {
        assert(response == ACK, "response must be ACK");
      })
      .catch((err) => ERROR("GetChipID", err));

    // receive packet
    await this.ReceivePacket()
      .then((packet: Packet) => {
        if (packet == null) throw new Error("Packet was corrupted");

        chip_id = ((packet.Data[2] << 8) | packet.Data[3]) as number;
        if (!this.CHIP_ID.includes(chip_id)) ERROR("Unrecognized Chip Id");
      })
      .catch((err) => ERROR("GetChipID:", err));

    // Check commands status
    this.CheckIfStatusIsSuccess(await this.GetStatus());

    assert(chip_id != null, "Chip Id must be != null");
    return chip_id;
  }

  SetXOSC(...params: any): void {
    throw new Error("Method not implemented.");
  }

  // ReadInto
  async ReadInto(buffer: ArrayBuffer, time_to_wait: number = 0.1) {
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
