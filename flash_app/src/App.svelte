<script>
  import * as script from "../scripts/script";
</script>

<main>
  <div>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" />
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Kenia&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Audiowide" />
  </div>

  <h1
    class="text-center"
    style="font-family:'Audiowide', sans-serif;   font-size: 100px;
  "
  >
    ASTEROID
  </h1>

  <div class="d-flex justify-content-center m-5">
    <div class=" col-sm-5 text-center border border-5 rounded-3 p-3">
      <span class="h2 fw-bold">Upload File</span>
      <input type="file" id="image" class="form-control w-50 m-auto mt-3" accept=".hex , .bin, .zip" />
      <div class="progress mt-3 w-50 m-auto" role="progressbar" aria-valuemin="0" aria-valuemax="100">
        <div id="bar" class="progress-bar progress-bar-striped progress-bar-animated" style="width: 0%" />
      </div>
      <div class="mt-4">
        <button id="flash_but" class=" btn btn-success">Flash firmware</button>
      </div>

      <div id="message_div" class="alert mt-2 w-50 m-auto" style="display:none;" role="alert" />
    </div>
  </div>

  <div class="form-group text-center">
    <label class="h2 mt-5" for="console_div">Console</label>
    <textarea class="form-control w-50 m-auto" id="console_div" rows="10" readonly style="resize: none;" />
  </div>

  <div class="mt-5 w-50 m-auto">
    <h2 style="text-align: center;">Description:</h2>
    ASTEROID is a web-based application that contributes to the advancement of IoT device management by providing
    a practical solution for firmware updates. The system is designed to interface with popular embedded operating
    systems such as Contiki-NG and Zephyr OS's, leveraging their bootloader functionalities of device for firmware
    deployment. Through a user-friendly web interface, device administrators can effortlessly initiate the update
    process by selecting the target IoT device and specifying the firmware to be flashed in memory.For your convenience,
    you can check the current list of
    <a href="./supported_devices.html" target="_blank">Supported Devices</a> and the
    <a href="./instructions.html" target="_blank">Application Instructions</a>.
  </div>

  <div style="padding:50px;" />

  <!-- hidden buttons -->
  <button type="button" id="picker" hidden>Download</button>
  <button type="button" id="connectButton" hidden />
</main>
