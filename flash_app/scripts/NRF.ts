import { DEBUG } from "./library";

enum OpcodeNRF {
  ProtocolVersion = 0x00,
  Create = 0x01,
  SetReceiptNotification = 0x02,
  CRC = 0x03,
  Execute = 0x04,
  Select = 0x06,
  GetMTU = 0x7,
  Write = 0x08,
  Ping = 0x09,
  GetHWVersion = 0x0a,
  GetFWVersion = 0x0b,
  Abort = 0x0c,
}

export class NRF {
  constructor() {}

  public FlashFirmware() {
    DEBUG("NRF constructor");
  }
}
