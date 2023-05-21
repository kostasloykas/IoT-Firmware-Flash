
/* script.ts */

import * as lib from './library';
import $ from 'jquery';

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

        // TODO: create firmware file instance



        Alert("Image uploaded successfully","success");
        image_selected = true;

    });
});




// ====================== MAIN ===========================

async function Main() {
    lib.assert(image_selected === true,"No image has been selected");
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
    let device = lib.CreateInstanceOf[type_of_device](port); // call dispatcher and create the instance
    
    device.Main();

}