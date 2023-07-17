/* script.ts */
import $ from "jquery";
import * as lib from "./classes";
import { CC2538 } from "./cc2538";
import { NRF_DONGLE } from "./dongle_nrf";
// import { CC26xx } from "./cc26xx";

// ==================== VARIABLES =========================

let image_selected: boolean = false;
let timeout: any = null;
let image: lib.FirmwareFile | lib.ZipFile = null;

export let SUPPORTED_DEVICES: Map<lib.Device, any> = new Map<lib.Device, any>([
  [new lib.Device(0x10c4, 0xea60), new CC2538()], // zolertia
  [new lib.Device(0x1915, 0x521f), new NRF_DONGLE()], // nrf52840 dongle bootloader
  [new lib.Device(0x403, 0x6010), new CC2538()], // openmote-b
  // TODO: [new lib.Device(0x403, 0x6010), new CC2538()], // openmote-cc2538
  // [new lib.Device(0x1366, 0x1015), new NRF()], // nrf52840 DK
  // [new lib.Device(0x2fe3, 0xa), new NRF()], // nrf52840 dongle
  // [new lib.Device(0x451, 0xbef3), new CC26xx()],
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
}

function InstanceOf(device: lib.Device): any {
  let instance = null;
  SUPPORTED_DEVICES.forEach((value, key) => {
    if (key.equals(device)) {
      instance = value;
    }
  });
  return instance;
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

  // Prompt user to select any serial port.
  let port: any = null;
  await navigator.serial
    .requestPort()
    .then((port_: any) => {
      port = port_;
    })
    .catch((error: any) => {
      Alert(
        "Please select the port in order \
          to flash the firmware",
        "danger"
      );
      lib.ERROR("Request port: ", error);
      ReleaseFlashButton();
      return;
    });

  lib.assert(port != null, "Port must be != null");

  // check the vendor id and product id of device
  // must be inside the supported vendors and products id
  const product_id: number = port.getInfo().usbProductId;
  const vendor_id: number = port.getInfo().usbVendorId;

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
