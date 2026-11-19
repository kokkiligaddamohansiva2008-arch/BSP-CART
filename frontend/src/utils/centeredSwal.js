import SweetAlert from "sweetalert2";

/**
 * A single notification/dialog entry point for every BSP CART page.
 * Show all information, success, error and confirmation popups in the
 * center of the viewport, above the fixed navigation and dashboard menu.
 */
const centeredSwal = {
  fire(...args) {
    // Support both Swal.fire({ ...options }) and Swal.fire(title, text, icon).
    const options = args.length === 1 && typeof args[0] === "object" && args[0] !== null
      ? args[0]
      : { title: args[0], text: args[1], icon: args[2] };

    return SweetAlert.fire({
      ...options,
      position: "center",
      toast: false,
      target: "body",
      heightAuto: false,
      backdrop: options.backdrop === false ? false : true,
    });
  },
};

export default centeredSwal;
