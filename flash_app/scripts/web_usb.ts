//================== FUNCTIONS ===================================

import { DEBUG, ERROR } from "./classes";

declare global {
  interface Navigator {
    usb: any;
  }
}
export async function RequestDevice(filters: any): Promise<any> {
  let device: any = null;

  await navigator.usb
    .requestDevice({ filters })
    .then((usbDevice: any) => (device = usbDevice))
    .catch((e: any) => {
      ERROR(`There is no device. ${e}`);
    });

  return device;
}
