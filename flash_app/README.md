Prerequirements:

1.The user must grant read and write access to the port (e.g sudo chmod 666 /dev/ttyUSB0)

2.For linux sudo apt-get install build-essential libudev-dev
For windows you can install one using Zadig or another approach is to use the UsbDK Backend of libusb by immediately calling usb.useUsbDkBackend().
