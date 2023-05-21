
/* script.ts */

import * as lib from './library';
import $ from 'jquery';
import { GetTypeOfDevice } from './library';

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
    
    
    // ====================== EVENT LISTENERS ==================

    // event listener for flash firmware button
    $("#flash_but").on("click", () => {

        if(image_selected)
            Main();
        else
            Alert("No image has been selected","danger");
        

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





// TODO: Main
async function Main(params?:any) {
    lib.assert(image_selected === true,"No image has been selected");
    
    
    // Prompt user to select any serial port.
    const port = await navigator.serial.requestPort();


    let type_of_device = lib.GetTypeOfDevice(port);
    let device = lib.CreateInstanceOf[type_of_device](); // call dispatcher and create the isntance
    
    device_selected = true;






    // lib.assert(device_selected === true,"No image has been selected");


    // TODO: FlashFirmware();
}