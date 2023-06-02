import { ACK, DEBUG, ERROR, FirmwareFile, NACK, PRINT, Packet, RESPOND, assert, Command } from "./library";

enum VERSION_CC2538 {
  _512_KB,
  _256_KB,
  _128_KB,
}

// To encode data before send them to device
class Encoder {
  public encode(data: number[]): Uint8Array {
    const encodedData = new Uint8Array(data);
    return encodedData;
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
  };

  CHIP_ID: number[] = [0xb964, 0xb965];

  // TODO: Flash firmware
  FlashFirmware(port: any, image: FirmwareFile) {
    // Initialize
    this.port = port;
    this.encoder = new Encoder();
    this.decoder = new Decoder();

    // Open port
    PRINT("Try to open the port");
    this.OpenPort()
      .then(() => {
        PRINT("Port opened");
      })
      .catch((error) => {
        ERROR("OpenPort:", error);
      });

    return;

    PRINT("Try to invoke bootloader");
    this.InvokeBootloader() //Invoke bootloader
      .then(() => {
        PRINT("Bootloader invoked");
      })
      .catch((err) => {
        ERROR("Invoke bootloader problem", err);
      });

    return;

    PRINT("Try to Synch");
    this.SendSync();
    PRINT("Synchronized");
    return;

    PRINT("Try to Ping");
    this.Ping();
    PRINT("Bootloader pinged");

    let chip_id = this.GetChipID();
    return;

    this.ClosePort() // Close port
      .catch((err) => {
        ERROR("Port can't be closed ", err);
      });
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
  //   FIXME:
  async GetStatus(...params: any): Promise<number> {
    let data: Uint8Array = this.encoder.encode([0x23]);
    let packet: Packet = new Packet(data);

    this.Write(packet).catch((err) => {
      ERROR("GetStaus:", err);
    });

    // wait for ack
    this.WaitForAck().catch((err) => {
      ERROR("GetStaus:", err);
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

  //   TODO:
  Reset(...params: any): void {
    throw new Error("Method not implemented.");
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
