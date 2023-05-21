
/* script.ts */

import * as lib from './library';
import $ from 'jquery';
import { GetTypeOfDevice } from './library';

let device_selected :boolean = false;
let image_selected :boolean = false;
let timeout:any = null;



// ====================== FUNCTIONS ==================

function Alert(message:string,type_of_alert:string, duration:number = 4000) {
    if (timeout !== null) {
        clearTimeout(timeout);
    }
    
    $("#message_div").removeClass(["alert-success","alert-danger"]);
    $("#message_div").addClass("alert-".concat(type_of_alert));
    $("#message_div").html(message).show("fast");

    timeout = setTimeout(function () {
        timeout = null;
        $('#message_div').hide("fast"); // Hide the element after duration
    }, duration);
}




// TODO: Flash the firmware image in device
function FlashFirmware(params:any[]) {
    


}



// ====================== ON LOAD OF PAGE ==================
window.addEventListener("load", function () {

    // Check if browser support Web Serial Api
    lib.CheckForSerialNavigator();
    
    
    // ====================== EVENT LISTENERS ==================

    // event listener for flash firmware button
    $("#flash_but").on("click", () => {

        if(image_selected)
            Main();
        else
            Alert("No image has been selected","danger");
    });



    // When image is being upload  
    $("#image").on("input", async () => {

        if($("#image").val() == ''){
            image_selected = false;
            Alert("Image unselected","danger");
            return;
        }

        Alert("Image uploaded successfully","success");
        image_selected = true;

        // TODO: create firmware file instance

    });
});




// ====================== MAIN ===========================

async function Main(params?:any) {
    lib.assert(image_selected === true,"No image has been selected");
    
    let port:any;

    try {
        // Prompt user to select any serial port.
        port = await navigator.serial.requestPort();
        device_selected = true;
    } catch (error) {
        Alert("Please select the device that you want \
        to flash the firmware","danger");
        return;
    }


    let type_of_device = lib.GetTypeOfDevice(port);
    let device = lib.CreateInstanceOf[type_of_device](); // call dispatcher and create the isntance
    






    


    // TODO: FlashFirmware();
}