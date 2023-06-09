import { ACK, DEBUG, ERROR, FirmwareFile, NACK, PRINT, Packet, RESPOND, assert, Command } from "./library";

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
    let byte4: number = address >> 0 && 0xff;
    let byte3: number = address >> 8 && 0xff;
    let byte2: number = address >> 16 && 0xff;
    let byte1: number = address >> 24 && 0xff;
    return [byte1, byte2, byte3, byte4];
  }
}

// FIXME: Decode data that came from device
class Decoder {
  public decode(data: number[]): Uint8Array {
    const decodedData = new Uint8Array(data);
    return decodedData;
  }
}

export class CC2538 implements Command {
  version: VERSION_CC2538;
  port: any;
  writer: any;
  reader: any;
  encoder: Encoder;
  decoder: Decoder;
  filters: object = {
    dataBits: 8,
    baudRate: 115200, //maximum 115200
    stopbits: 1,
    parity: "none",
    flowControl: "none", // Hardware flow control using the RTS and CTS signals is enabled.
  };
  CHIP_ID: number[] = [0xb964, 0xb965];
  start_address: number = 0x00200000; //start address of flashing
  configuration_address_of_bootloader: number = null;
  FLASH_CTRL_DIECFG0 = 0x400d3014;

  // TODO: Flash firmware
  async FlashFirmware(port: any, image: FirmwareFile) {
    // Initialize
    this.port = port;
    this.encoder = new Encoder();
    this.decoder = new Decoder();

    // Open port
    PRINT("Try to open the port");
    await this.OpenPort()
      .then(() => {
        PRINT("Port opened");
      })
      .catch((error) => {
        ERROR("OpenPort:", error);
      });

    return;

    PRINT("Try to invoke bootloader");
    await this.InvokeBootloader() //Invoke bootloader
      .then(() => {
        PRINT("Bootloader invoked");
      })
      .catch((err) => {
        ERROR("Invoke bootloader problem", err);
      });

    return;

    PRINT("Try to Synch");
    await this.SendSync();
    PRINT("Synchronized");
    return;

    let chip_id = this.GetChipID();
    return;

    PRINT("Try to Ping");
    await this.Ping();
    PRINT("Bootloader pinged");
    return;

    PRINT("Try to find informations about device");
    this.FlashSize();
    PRINT("Informations received");
    return;

    PRINT("Try to configure CCA");
    this.ConfigureCCA();
    PRINT("CCA configured");
    return;

    PRINT("Try to Erase");
    this.Erase();
    PRINT("Erase Done");
    return;

    PRINT("Try to Download");
    this.Download(image.Size);
    PRINT("Download configured");
    return;

    PRINT("Try to reset device");
    this.Reset();
    PRINT("Device has been reset");
    return;

    this.ClosePort() // Close port
      .catch((err) => {
        ERROR("Port can't be closed ", err);
      });
  }

  FlashSize(): void {
    throw new Error("Method not implemented.");
  }

  // FIXME: invoke bootloader
  async InvokeBootloader() {
    await this.port.setSignals({ dataTerminalReady: true });
    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for some time
    await this.port.setSignals({ dataTerminalReady: false });
  }

  // FIXME: Open port
  async OpenPort() {
    await this.port.open(this.filters);
  }
  async ClosePort() {
    await this.reader.close();
    await this.writer.close();
    await this.port.close();
    PRINT("Port closed");
  }

  //   TODO:
  ConfigureCCA() {}

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
  //   FIXME: Receive Packet
  async ReceivePacket() {
    const [size, checksum] = await this.Read(2); //read size and checksum

    let data: Uint8Array = new Uint8Array(await this.Read(size - 2));
    let packet: Packet = new Packet(data);

    if (packet.Checksum !== new Uint8Array([checksum])) ERROR("ReceivePacket: checksum error");

    return Promise.resolve(packet).then((packet) => {
      return packet;
    });
  }

  // FIXME: Send Sync
  SendSync(): void {
    let data: Uint8Array = this.encoder.encode([0x55]);
    this.ClearInputBuffer();

    this.Write(data).catch((err) => {
      ERROR("SendSynch", err);
    });
    this.Write(data).catch((err) => {
      ERROR("SendSynch", err);
    });

    // wait for ack
    this.WaitForAck().catch((err) => {
      ERROR("SendSynch", err);
    });
  }

  // FIXME: Wait for ack
  async WaitForAck() {
    let data: Uint8Array = null;
    await this.Read(2).then((array) => (data = array));

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
  //   FIXME: Download
  Download(image_size: number): void {
    let addr = this.encoder.encode_addr(this.start_address);
    let size = this.encoder.encode_addr(image_size);
    // let encode_size = ;
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

    this.Write(packet).catch((err) => {
      ERROR("Download:", err);
    });

    this.WaitForAck().catch((err) => {
      ERROR("Download:", err);
    });

    this.GetStatus();
  }
  //   TODO:
  Run(...params: any): void {
    throw new Error("Method not implemented.");
  }
  //   FIXME: Get status
  async GetStatus(): Promise<number> {
    let data: Uint8Array = this.encoder.encode([0x23]);
    let packet: Packet = new Packet(data);

    this.Write(packet).catch((err) => {
      ERROR("GetStatus:", err);
    });

    this.WaitForAck().catch((err) => {
      ERROR("GetStatus:", err);
    });

    packet = await this.ReceivePacket();
    // FIXME: respond return
    return RESPOND.COMMAND_RET_FLASH_FAIL;
  }
  //   FIXME: Ping
  Ping(): void {
    let data: Uint8Array = this.encoder.encode([0x20]);
    let packet: Packet = new Packet(data);

    this.Write(packet).catch((err) => {
      ERROR("Ping:", err);
    });

    // wait for ack
    this.WaitForAck().catch((err) => {
      ERROR("Ping", err);
    });
  }

  // TODO:
  CheckLastCommand(): void {
    throw new Error("Method not implemented.");
  }

  // FIXME: Write
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

  // FIXME: Read
  async Read(length: number, timeout: number = 400) {
    this.reader = this.port.getReader();
    const { data: value, done } = await Promise.race([
      this.reader.read(length),
      new Promise<void>((resolve, reject) =>
        setTimeout(() => {
          ERROR("Timeout occurred");
        }, timeout)
      ),
    ]);

    this.reader.releaseLock();

    if (done) return null;

    if (value) {
      DEBUG("Data read");
      let data: Uint8Array = this.decoder.decode(value);
      DEBUG(data);
      return data;
    }
  }

  //   FIXME: Reset
  Reset(): void {
    let data: Uint8Array = this.encoder.encode([0x25]);
    let packet: Packet = new Packet(data);

    this.Write(packet).catch((err) => {
      ERROR("Reset:", err);
    });

    // wait for ack
    this.WaitForAck().catch((err) => {
      ERROR("Reset", err);
    });
  }
  //   TODO:
  Erase(...params: any): void {
    throw new Error("Method not implemented.");
  }
  // FIXME: Get Chip Id
  GetChipID(): void {
    // send the command
    this.Write(new Packet(new Uint8Array([0x20]))).catch((err) => ERROR("GetChipID", err));
    // wait for ACK
    this.WaitForAck().catch((err) => ERROR("GetChipID", err));
    // read 4 bytes that contain chip id
    this.Read(4)
      .then((array: Uint8Array | null) => {
        assert(array != null, "GetChipId expected data but null came");
        let chip_id: number = ((array[0] << 8) | array[1]) as number;
        if (chip_id in this.CHIP_ID) ERROR("Chip Id wasn't the right");
      })
      .catch((err) => ERROR("GetChipID:", err)); // read 4 bytes that is chip id
    // send ACK
    this.SendAck();
    return;
  }
  //   TODO:
  SetXOSC(...params: any): void {
    throw new Error("Method not implemented.");
  }

  // FIXME: Clear Input Buffer
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
