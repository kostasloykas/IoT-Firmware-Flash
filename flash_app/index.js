import { usb, getDeviceList } from "usb";

const devices = getDeviceList();

for (const device of devices) {
    
    if(device.deviceDescriptor.idVendor == 0x1915)
        console.log(device);
}