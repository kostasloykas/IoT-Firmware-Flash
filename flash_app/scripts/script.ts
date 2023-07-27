/* script.ts */
import $ from "jquery";
import * as lib from "./classes";
import { CC2538 } from "./cc2538";
import { NRF_DONGLE } from "./dongle_nrf52840";
import { NRF_DK } from "./DK_nrf52840";
import * as usb from "./web_usb";

// ==================== VARIABLES =========================

let image_selected: boolean = false;
let timeout: any = null;
let image: lib.FirmwareFile | lib.ZipFile = null;

let SUPPORTED_SERIAL_DEVICES: Map<lib.Device, any> = new Map<lib.Device, any>([
  [new lib.Device(0x10c4, 0xea60), new CC2538()], // zolertia
  [new lib.Device(0x1915, 0x521f), new NRF_DONGLE(false)], // nrf52840 dongle bootloader
  [new lib.Device(0x1915, 0x520f), new NRF_DONGLE(true)], // nrf52840 dongle bootloader if needs to trigger bootloader
  [new lib.Device(0x403, 0x6010), new CC2538()], // openmote-b
  // [new lib.Device(0x403, 0x6010), new CC2538()], // openmote-cc2538
]);

let SUPPORTED_USB_DEVICES: Map<lib.Device, any> = new Map<lib.Device, any>([
  [new lib.Device(0x1366, 0x1015), new NRF_DK()], // nrf52840 DK
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

// update page
function UpdatePage() {
  ReleaseFlashButton();
}

function ReleaseFlashButton(): void {
  let flash_button = $("#flash_but");
  flash_button.prop("disabled", false);
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
  SUPPORTED_SERIAL_DEVICES.forEach((value, key) => {
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
    const usbVendorId: number = device[0].vendor;
    const usbProductId: number = device[0].product;
    filters.push({ usbVendorId, usbProductId });
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
    .catch((error: any) => {});

  // Try to find usb devices
  if (didnt_found_port) {
    lib.DEBUG("asdjhks");
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

    flash_button.prop("disabled", true);
    Main();
  });

  // When image is being upload
  $("#image").on("input", async () => {
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
    // zip file upload
    else if (extention == "zip") image = new lib.ZipFile(input_element);
    else lib.assert(0, "unrecognized extention");

    Alert("Image uploaded successfully", "success");
    image_selected = true;
  });

  //
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
  // FIXME: uncomment verify tilergatis signature
  // image.VerifyTilergatiSignature();

  lib.UpdateProgressBar("0%");

  // Try to find devices
  let [port, api_used]: any = await FindPort().catch((err) => {
    lib.ERROR("FindPort", err);
  });

  lib.assert(port != null, "Port must be != null");

  // check the vendor id and product id of device
  // must be inside the supported vendors and products id
  const [vendor_id, product_id] = GetVendorAndProductId(port, api_used);

  let device_type: lib.Device = new lib.Device(vendor_id, product_id);
  lib.PRINT("Vendor and Product ID:", vendor_id.toString(16), product_id.toString(16));

  let device = InstanceOf(device_type); // create object

  if (device == null) lib.ERROR("This device does not supported");
  else lib.PRINT("Device is ", device);

  await device.FlashFirmware(port, image);

  Alert("The process finished successfully", "success");
  UpdatePage(); // update page after flashing
  return;
}
