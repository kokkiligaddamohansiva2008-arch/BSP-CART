import { createPortal } from "react-dom";
import "./Modal.css";

function Modal({ title, children, show, onClose, size = "md" }) {
  if (!show) return null;

  // Render directly beneath body so dashboard/navbar stacking contexts
  // cannot cover the modal, regardless of which page opens it.
  return createPortal(
    <div className="modal-overlay" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`custom-modal ${size === "lg" ? "custom-modal-lg" : ""}`}
      >
        <div className="modal-header">
          <h3>{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close dialog">
            ✖
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
