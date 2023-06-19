<script>
  //bind:files enable to access and manipulate
  //the selected files in your Svelte component.
  import * as script from "../scripts/script";
</script>

<main>
  <div>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" />
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.min.js"></script>
  </div>
  <div class="d-flex justify-content-center m-5">
    <div class=" col-sm-5 text-center border border-success border-3 rounded-3 p-3">
      <span class="h2 fw-bold">Upload file</span>
      <input type="file" id="image" class="form-control w-50 m-auto mt-3" accept=".hex , .bin" />
      <div class="progress mt-3 w-50 m-auto" role="progressbar" aria-valuemin="0" aria-valuemax="100">
        <div id="bar" class="progress-bar progress-bar-striped progress-bar-animated" style="width: 0%" />
      </div>
      <div class="mt-4">
        <button id="flash_but" class=" btn btn-success">Flash firmware</button>
      </div>

      <div id="message_div" class="alert mt-2 w-50 m-auto" style="display:none;" role="alert" />
    </div>
  </div>
</main>
