
/* project.ts */

import * as lib from './library';
import $, { timers } from 'jquery';


// ====================== ON LOAD OF PAGE ==================
window.addEventListener("load", function () {

    // Check if browser support Web Serial Api
    lib.CheckForSerialNavigator();
    let firmware_file = null;

    // ====================== EVENT LISTENERS ==================
    $("#but_device").on("click", async () => {
        // Prompt user to select any serial port.
        const port = await navigator.serial.requestPort();

        // make instance command interface
    });



    // When image is being uploaded  
    $("#image").on("input", async () => {

        let message: string = "Image uploaded successfully";
        $("#message_div").addClass("alert-success");
        $("#message_div").html(message);



        // TODO: if something went wrong print Error

    });
});






