/* script.ts */

import * as lib from "./library";
import $, { error } from "jquery";
import { FirmwareFile } from "./library";

let device_selected: boolean = false;
let image_selected: boolean = false;
let timeout: any = null;
let image: FirmwareFile = null;
let device_name: string = null;

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
    lib.PRINT("Device selected: ", device_name);

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

    image = new FirmwareFile(input_element);

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
});

// ====================== MAIN ===========================

async function Main() {
  lib.assert(image_selected === true, "No image has been selected");
  lib.assert(device_selected === true, "No device has been selected");
  lib.assert(device_name in lib.SUPPORTED_DEVICES, "Device is not supported => " + device_name);
  let port: any;

  try {
    // Prompt user to select any serial port.
    port = await navigator.serial.requestPort();
  } catch (error) {
    Alert(
      "Please select the port in order \
          to flash the firmware",
      "danger"
    );
    let flash_button = $("#flash_but");
    flash_button.prop("disabled", false);
    lib.ERROR(error);
    return;
  }

  let device = lib.CreateInstanceOf[device_name](); // call dispatcher and create the instance
  device.FlashFirmware(port, image);

  Alert("The process finished succsfully", "success");
  return;
}
