Prerequirements for Linux:

1.The user must grant read and write access to the port (e.g sudo chmod 666 /dev/ttyUSB0)

2. USB permmissions  
   sudo usermod -aG dialout <user>
   sudo nano /etc/udev/rules.d/99-slusb.rules and append this command ' SUBSYSTEM=="usb", MODE="0666", GROUP="dialout" '

3. Run google chrome as root
   sudo nano /opt/google/chrome/google-chrome
   Replace at the end of file
   exec -a "$0" "$HERE/chrome" "$@"
   with
   exec -a "$0" "$HERE/chrome" "$@"--user-data-dir --test-type --no-sandbox

Prerequirements for Windows:

1. Run chrome as administrator.

2. For windows you can install one using Zadig or another approach is to use the UsbDK Backend of libusb by immediately calling usb.useUsbDkBackend().
