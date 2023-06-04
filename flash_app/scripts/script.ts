/* script.ts */
import $ from "jquery";
import * as lib from "./library";
import { CC2538 } from "./cc2538";
import { assert } from "console";

// =================== DISPATCHER ================
type CreateInstanceDispatcher = {
  [key: string]: () => CC2538;
};

// Dispatcher for creating instances auto of a specific device
export const CreateInstanceOf: CreateInstanceDispatcher = {
  [lib.SUPPORTED_DEVICES.CC2538]: () => {
    return new CC2538();
  },
};

// ==================== VARIABLES =========================

// FIXME: device selected = false
let device_selected: boolean = true;
let image_selected: boolean = false;
let timeout: any = null;
let image: lib.FirmwareFile = null;
// FIXME: device name = null
let device_name: string = "CC2538";

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

    if (!device_selected) {
      Alert("No device selected", "danger");
      return;
    }
    if (!image_selected) {
      Alert("No image selected", "danger");
      return;
    }

    flash_button.prop("disabled", true);
    Main();
  });

  $("#device").on("change", () => {
    device_name = $("#device").val() as string;
    lib.PRINT("Device selected: ".concat(device_name));

    if (device_name == "null") {
      Alert("No device selected", "danger");
      device_selected = false;
      return;
    }

    Alert("Device selected " + device_name, "success");
    device_selected = true;
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
  lib.assert(device_selected === true, "No device has been selected");
  lib.assert(device_name in lib.SUPPORTED_DEVICES, "Device is not supported => " + device_name);
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
  lib.PRINT("Vendor and Product ID:", port.getInfo());

  let device = CreateInstanceOf[device_name](); // call dispatcher and create the instance
  await device.FlashFirmware(port, image);
  Alert("The process finished succsfully", "success");
  ReleaseFlashButton();

  return;
}
