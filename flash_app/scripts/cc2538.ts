import { buffer } from "stream/consumers";
import {
  ACK,
  DEBUG,
  ERROR,
  FirmwareFile,
  NACK,
  PRINT,
  Packet,
  RESPOND as RESPONSE,
  assert,
  Command,
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
    baudRate: 460800, //maximum 115200 , 460800
    stopbits: 1,
    parity: "none",
    flowControl: "none", // Hardware flow control using the RTS and CTS signals is enabled.
    // bufferSize: 4 * 1024, //4KB
  };
  CHIP_ID: number[] = [0xb964, 0xb965];
  start_address: number = 0x00200000; //start address of flashing
  FLASH_CTRL_DIECFG0: number = 0x400d3014;

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

    PRINT("Try to invoke bootloader");
    await this.InvokeBootloader() //Invoke bootloader
      .catch((err) => {
        ERROR("Invoke bootloader:", err);
      })
      .then(() => {
        PRINT("Bootloader Invoked");
      });

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

    // PRINT("Try to find informations about device");
    // this.FlashSize();
    // PRINT("Informations received");
    // return;

    // PRINT("Try to configure CCA");
    // this.ConfigureCCA();
    // PRINT("CCA configured");
    // return;

    // PRINT("Try to Erase");
    // this.Erase();
    // PRINT("Erase Done");
    // return;

    // PRINT("Try to Download");
    // this.Download(image.Size);
    // PRINT("Download configured");
    // return;

    // PRINT("Try to reset device");
    // await this.Reset();
    // PRINT("Device has been reset");

    // this.ClosePort() // Close port
    //   .catch((err) => {
    //     ERROR("Port can't be closed ", err);
    //   });

    return;
  }

  FlashSize(): void {
    throw new Error("Method not implemented.");
  }

  // invoke bootloader
  async InvokeBootloader() {
    await this.port.setSignals({ dataTerminalReady: true, requestToSend: false });
    await this.port.setSignals({ requestToSend: true });
    await this.port.setSignals({ requestToSend: false });
    await new Promise((resolve) => setTimeout(resolve, 10)); // Wait for some time
    await this.port.setSignals({ dataTerminalReady: false });
    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for some time
  }

  // Open port
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

  async SendAck() {
    let ack: Uint8Array = new Uint8Array([0x00, ACK]);
    await this.Write(ack);
  }
  async SendNAck() {
    let nack: Uint8Array = new Uint8Array([0x00, NACK]);
    await this.Write(nack);
  }
  //   FIXME: Receive Packet
  // @returns {null if checksum wasn't valid} or {Packet} .
  async ReceivePacket(): Promise<Packet> {
    let size: number;
    let checksum: number;
    let data: Uint8Array;

    //read size and checksum
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

    if (packet.Checksum !== checksum) return null;
    return packet;
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
  async WaitForAck(): Promise<number> {
    let data: Uint8Array = null;
    await this.ReadInto(new ArrayBuffer(2)) //read 2 bytes
      .then((array) => (data = array))
      .catch((err) => {
        ERROR("WaitForAck", err);
      });

    if (data[0] == 0x00 && data[1] == ACK) return ACK;
    else if (data[0] == 0x00 && data[1] == NACK) NACK;

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
  Run(): void {
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
    // FIXME: response return
    return RESPONSE.COMMAND_RET_FLASH_FAIL;
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
    // if data are bytes

    if (data instanceof Uint8Array) {
      assert(data.length <= 254, "data length must be <= 254");
      // if (data.length>254){
      //   let start: number = 0;
      //   let end: number = 0;
      //   for (let index = 0; index < data.length; index += 254) {
      //     let packet: Packet = new Packet(data.slice(index, index + 254));
      //     await this.writer.write(packet);
      //     start = index;
      //   }else
      await this.writer.write(data);
      // if data is packet
    } else if (data instanceof Packet) {
      let packet: Packet = data;
      await this.writer.write(new Uint8Array([packet.Size]));
      await this.writer.write(new Uint8Array([packet.Checksum]));
      await this.writer.write(data.Data);
    }
  }

  //   FIXME: Reset
  async Reset() {
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
        if (packet == null) {
          this.SendNAck(); //send ACK
          throw new Error("Packet was corrupted");
        } else {
          this.SendAck(); //send NACK
          DEBUG("Packet came:", packet);
        }

        chip_id = ((packet.Data[2] << 8) | packet.Data[3]) as number;
        if (!this.CHIP_ID.includes(chip_id)) ERROR("Unrecognized Chip Id");
      })
      .catch((err) => ERROR("GetChipID:", err));

    // FIXME: get status
    // await this.GetStatus();

    assert(chip_id != null, "Chip Id must be != null");
    return chip_id;
  }
  //   TODO:
  SetXOSC(...params: any): void {
    throw new Error("Method not implemented.");
  }

  // ReadInto
  async ReadInto(buffer: ArrayBuffer) {
    let offset = 0;

    while (offset < buffer.byteLength) {
      let timeout = setTimeout(() => {
        ERROR("Read timeout occurred");
      }, 100); // 100ms

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
