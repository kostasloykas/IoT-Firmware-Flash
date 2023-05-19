
/* project.ts */

import * as chips from './chips';


// ====================== ON LOAD OF PAGE ==================

chips.CheckForSerialNavigator();

let firmware_file = null;




// ====================== EVENT LISTENERS ==================

document.getElementById("but_device").addEventListener('click', async () => {
    // Prompt user to select any serial port.
    const port = await navigator.serial.requestPort();

    // make instance command interface


});



document.getElementById("image").addEventListener('input', async () => {

    chips.DEBUG("mpike");


});





