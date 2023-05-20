
/* script.ts */

import * as lib from './library';
import $ from 'jquery';

let device_selected :boolean = false;
let image_selected :boolean = false;



// ====================== FUNCTIONS ==================

function Alert(message:string,type_of_alert:string, duration:number = 4000) {
    $("#message_div").removeClass(["alert-success","alert-danger"]);
    $("#message_div").addClass("alert-".concat(type_of_alert));
    $("#message_div").html(message).show("fast");

    setTimeout(function () {
        $('#message_div').hide("slow"); // Hide the element after 3 seconds
    }, duration);
}


// TODO: Flash the firmware image in device
function FlashFirmware(params:any[]) {
    
}



// ====================== ON LOAD OF PAGE ==================
window.addEventListener("load", function () {

    // Check if browser support Web Serial Api
    lib.CheckForSerialNavigator();
    let firmware_file = null;

    // ====================== EVENT LISTENERS ==================


    // event listener for device button
    $("#but_device").on("click", async () => {
        // Prompt user to select any serial port.
        const port = await navigator.serial.requestPort();

        // TODO: device_selected = true
       
        //TODO: make instance command interface
    });


    // event listener for flash firmware button
    $("#flash_but").on("click", () => {
        // Prompt user to select any serial port.

        if (device_selected){
            if(image_selected){
                // TODO: FlashFirmware();
            }else{
                Alert("Image uploaded successfully","danger");
            }
        }else{
            Alert("No device has been selected","danger");
        }

    });



    // When image is being uploaded  
    $("#image").on("input", async () => {

        if($("#image").val() == ''){
            image_selected = false;
            Alert("Image unselected","danger");
        }else{
            Alert("Image uploaded successfully","success");
            image_selected = true;
        }


    });
});






