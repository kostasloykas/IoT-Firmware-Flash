
/* script.ts */

import * as lib from './library';
import $, { error } from 'jquery';
import { FirmwareFile } from './library';

let image_selected :boolean = false;
let timeout:any = null;
let image:FirmwareFile = null;




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

        let path: string = $("#image").val().toString(); 
        if( path == ''){
            image_selected = false;
            Alert("Image unselected","danger");
            return;
        }

        image = new FirmwareFile(path);

        Alert("Image uploaded successfully","success");
        image_selected = true;

    });


    // When device connect
    navigator.serial.addEventListener('connect', (e:any) => {
        Alert("Device connected","primary");
    });

    // When device disconnect
    navigator.serial.addEventListener('disconnect', (e:any)=> {
        Alert("Device disconnected","danger");
        lib.ERROR("Device disconnected");
    });


});




// ====================== MAIN ===========================

async function Main() {
    lib.assert(image_selected === true,"No image has been selected");
    lib.assert(image !== null,"No image has been selected");
    let port:any;
    
    try {
        // Prompt user to select any serial port.
        port = await navigator.serial.requestPort();
    } catch (error) {
        lib.PRINT(error);
        Alert("Please select the device in order \
        to flash the firmware","danger");
        return;
    }


    let type_of_device = lib.GetTypeOfDevice(port);
    let device = lib.CreateInstanceOf[type_of_device](); // call dispatcher and create the instance
    
    
    device.FlashFirmware(port,image);

}



