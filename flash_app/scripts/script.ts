/* script.ts */
import $ from "jquery";
import * as lib from "./library";
import { CC2538 } from "./cc2538";

// ==================== VARIABLES =========================

let image_selected: boolean = false;
let timeout: any = null;
let image: lib.FirmwareFile = null;

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

function ReleaseFlashButton(): void {
  let flash_button = $("#flash_but");
  flash_button.prop("disabled", false);
}

// ====================== ON LOAD OF PAGE ==================
window.addEventListener("load", function () {
  // Check if browser support Web Serial Api
  lib.CheckForSerialNavigator();

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

    image = new lib.FirmwareFile(input_element);

    Alert("Image uploaded successfully", "success");
    image_selected = true;
  });

  // When device connect
  navigator.serial.addEventListener("connect", (e: any) => {
    Alert("Device connected", "primary");
  });

  // When device disconnect
  navigator.serial.addEventListener("disconnect", (e: any) => {
    Alert("Device disconnected", "danger");
    lib.ERROR("Device disconnected");
  });

  //
  window.addEventListener("unhandledrejection", function (event) {
    alert(event.reason); // the unhandled error object
    lib.DEBUG(event.reason);
    Alert("Flash canceled", "danger");
    ReleaseFlashButton();
  });
});

// ====================== MAIN ===========================

async function Main() {
  lib.assert(image_selected === true, "No image has been selected");
  let port: any = null;

  try {
    // Prompt user to select any serial port.
    port = await navigator.serial.requestPort();
  } catch (error) {
    Alert(
      "Please select the port in order \
          to flash the firmware",
      "danger"
    );
    ReleaseFlashButton();
    return;
  }

  // FIXME: check the vendor id and product id of device
  // must be inside the supported vendors and products id
  const product_id: number = port.getInfo().usbProductId;
  const vendor_id: number = port.getInfo().usbVendorId;
  let device_type: lib.Device = { vendor: vendor_id, product: product_id };
  lib.PRINT("Vendor and Product ID:", vendor_id.toString(16), product_id.toString(16));

  lib.DEBUG(device_type);
  lib.DEBUG(lib.SUPPORTED_DEVICES);
  if (!lib.SUPPORTED_DEVICES.has(device_type)) {
    lib.ERROR("This device does not supported");
  }

  let device = lib.SUPPORTED_DEVICES.get(device_type); // call dispatcher and create the instance
  await device.FlashFirmware(port, image);
  return;
  Alert("The process finished succsfully", "success");
  ReleaseFlashButton();

  return;
}
