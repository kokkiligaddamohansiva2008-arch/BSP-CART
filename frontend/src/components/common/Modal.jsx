import "./Modal.css";

function Modal({ title, children, show, onClose, size = "md" }) {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className={`custom-modal ${size === "lg" ? "custom-modal-lg" : ""}`}>
        <div className="modal-header">
          <h3>{title}</h3>

          <button type="button" onClick={onClose}>
            ✖
          </button>
        </div>

        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
