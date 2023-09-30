/* script.ts */
import $ from "jquery";
import * as lib from "./classes";
import { CC2538 } from "./cc2538";
import { NRF_DONGLE } from "./dongle_nrf52840";
import { NRF_DK } from "./DK_nrf52840";
import { ARDUINO_MICRO } from "./arduino_micro";
import * as usb from "./web_usb";
import { GenericZip } from "./Signascribe/GenericZip";

// ==================== VARIABLES =========================

let image_selected: boolean = false;
let timeout: any = null;
let image: lib.FirmwareFile | lib.NRFZIP = null;
let tilergatis_zip = null;

let SUPPORTED_SERIAL_DEVICES: Map<lib.Device, any> = new Map<lib.Device, any>([
  [new lib.Device(0x10c4, 0xea60), new CC2538()], // zolertia
  [new lib.Device(0x1915, 0x521f), new NRF_DONGLE(false)], // nrf52840 dongle bootloader
  [new lib.Device(0x1915, 0x520f), new NRF_DONGLE(true)], // nrf52840 dongle bootloader if needs to trigger bootloader
  [new lib.Device(0x403, 0x6010), new CC2538()], // openmote-b
  [new lib.Device(0x1366, 0x1015), new NRF_DK()], // nrf52840 DK
  [new lib.Device(0x2341, 0x8037), new ARDUINO_MICRO()], // Arduino Micro
  // [new lib.Device(0x403, 0x6010), new CC2538()], // openmote-cc2538
]);

let SUPPORTED_USB_DEVICES: Map<lib.Device, any> = new Map<lib.Device, any>([
  [new lib.Device(0x0, 0x0), null], // dummy device
]);

// ====================== FUNCTIONS ==================

function Alert(message: string, type_of_alert: string, duration: number = 4000) {
  if (timeout !== null) {
    clearTimeout(timeout);
  }

  $("#message_div").removeClass(["alert-success", "alert-danger"]);
  $("#message_div").addClass("alert-".concat(type_of_alert));
  $("#message_div").html(message).show("fast");

  timeout = setTimeout(function () {
    timeout = null;
    $("#message_div").hide("fast"); // Hide the element after duration
  }, duration);
}

function ClearConsole() {
  $("#console_div").html("");
}

// update page
function UpdatePage(release_flash_button: boolean = true, clear_console: boolean = true) {
  if (release_flash_button) ReleaseFlashButton();
  else DisableFlashButton();

  if (clear_console) ClearConsole();
}

function ReleaseFlashButton(): void {
  let flash_button = $("#flash_but");
  flash_button.prop("disabled", false);
}

function DisableFlashButton(): void {
  let flash_button = $("#flash_but");
  flash_button.prop("disabled", true);
}

function CheckForSerialNavigator(): void {
  // Web Serial API is not available
  if (!("serial" in navigator)) {
    alert("Web Serial API is not available");
    lib.ERROR("Web Serial API is not available");
  }

  if (!("usb" in navigator)) {
    alert("Web USB API is not available");
    lib.ERROR("Web USB API is not available");
  }
}

function InstanceOf(device: lib.Device): any {
  let instance = null;
  // check for serial devices
  SUPPORTED_SERIAL_DEVICES.forEach((value, key) => {
    if (key.equals(device)) {
      instance = value;
    }
  });

  // check for web usb devices
  SUPPORTED_USB_DEVICES.forEach((value, key) => {
    if (key.equals(device)) {
      instance = value;
    }
  });
  return instance;
}

function GetFiltersForSerial(supported_devices: Map<lib.Device, any>): any[] {
  let filters = [];

  for (let device of supported_devices) {
    const usbVendorId: number = device[0].vendor;
    const usbProductId: number = device[0].product;
    filters.push({ usbVendorId, usbProductId });
  }

  return filters;
}

function GetFiltersForUsb(supported_devices: Map<lib.Device, any>): any[] {
  let filters = [];

  for (let device of supported_devices) {
    const vendorId: number = device[0].vendor;
    const productId: number = device[0].product;
    filters.push({ vendorId, productId });
  }

  return filters;
}

function GetVendorAndProductId(port: any, api_used: string): [number, number] {
  if (api_used == "serial") {
    return [port.getInfo().usbVendorId, port.getInfo().usbProductId];
  } else if (api_used == "usb") {
    return [port.vendorId, port.productId];
  } else {
    lib.assert(0, "GetVendorAndProductId");
  }
}

// Find port with
async function FindPort(): Promise<[any, string]> {
  let port: any = null;
  let didnt_found_port: boolean = true;
  let api_used: string = null;

  await navigator.serial
    .requestPort({ filters: GetFiltersForSerial(SUPPORTED_SERIAL_DEVICES) })
    .then((port_: any) => {
      port = port_;
      didnt_found_port = false;
      api_used = "serial";
    })
    .catch((error: any) => {
      if (error.name == "NotFoundError") {
        lib.PRINT("Can't use this device with Web Serial API");
        lib.PRINT("Lets try Web USB API");
      }
    });

  // Try to find usb devices
  if (didnt_found_port) {
    await usb
      .RequestDevice(GetFiltersForUsb(SUPPORTED_USB_DEVICES))
      .then((port_: any) => {
        port = port_;
        didnt_found_port = false;
        api_used = "usb";
      })
      .catch((err) => {});
  }

  if (didnt_found_port) {
    Alert("Didn't detect any device", "danger");

    ReleaseFlashButton();

    lib.ERROR("Didn't detect any device");
  }

  return [port, api_used];
}

// ====================== ON LOAD OF PAGE ==================
window.addEventListener("load", function () {
  // Check if browser support Web Serial Api
  CheckForSerialNavigator();

  // ====================== EVENT LISTENERS ==================
  // event listener for flash firmware button
  $("#flash_but").on("click", () => {
    let flash_button = $("#flash_but");

    if (!image_selected) {
      Alert("No image selected", "danger");
      return;
    }

    Main();
  });

  // When image is being upload
  $("#image").on("input", async () => {
    try {
      let path: string = $("#image").val().toString();

      if (path == "") {
        image_selected = false;
        Alert("Image unselected", "danger");
        return;
      }
      const input_element = document.querySelector('input[type="file"]') as HTMLInputElement;

      // seperate zip,hex,bin files
      let extention = path.split(".").pop();
      if (extention == "bin" || extention == "hex")
        image = new lib.FirmwareFile(input_element, "HTMLInputElement");
      // FIXME: zip file upload (fix handle error)
      else if (extention == "zip") {
        [tilergatis_zip, image] = await new GenericZip().ReturnTilergatisZipAndImage(input_element);

        if (image == null) lib.ERROR("Something went wrong with image");
      } else lib.assert(0, "unrecognized extention");

      Alert("Image uploaded successfully", "success");
      image_selected = true;
    } catch (err) {
      Alert("Image upload failed", "danger");
      lib.PRINT(err);
      image_selected = false;
      image = null;
      tilergatis_zip = null;
    }
  });

  window.addEventListener("unhandledrejection", function (event) {
    alert(event.reason); // the unhandled error object
    Alert("Flash canceled", "danger");
    UpdatePage();
  });
});

// ====================== MAIN ===========================

async function Main() {
  lib.assert(image_selected === true, "No image has been selected");
  lib.assert(image.Size != 0, "Image upload , size must be != 0");

  UpdatePage(false, true);
  lib.UpdateProgressBar("0%");

  // Try to find devices
  let [port, api_used]: any = await FindPort().catch((err) => {
    lib.ERROR("FindPort", err);
  });

  lib.assert(port != null, "Port must be != null");

  // check the vendor id and product id of device
  // must be inside the supported vendors and products id
  const [vendor_id, product_id] = GetVendorAndProductId(port, api_used);
  // FIXME: verify if vendor and product id is in manifest file

  let device_type: lib.Device = new lib.Device(vendor_id, product_id);
  lib.PRINT("Vendor and Product ID:", vendor_id.toString(16), product_id.toString(16));

  let device = InstanceOf(device_type); // create object

  if (device == null) lib.ERROR("This device does not supported");

  await device.FlashFirmware(port, image);

  Alert("The process finished successfully", "success");
  UpdatePage(true, false); // update page after flashing
  return;
}
