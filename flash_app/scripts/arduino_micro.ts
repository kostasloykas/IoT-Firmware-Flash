import { DEBUG, FirmwareFile } from "./classes";

export class ARDUINO_MICRO {
  constructor() {
    DEBUG("egine");
  }

  async FlashFirmware(port: any, image: FirmwareFile) {
    return;
  }
}
