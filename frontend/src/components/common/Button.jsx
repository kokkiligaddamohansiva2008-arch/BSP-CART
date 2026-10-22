import "./Button.css";

function Button({
  text,
  type = "button",
  variant = "primary",
  icon,
  onClick,
  disabled = false,
}) {
  return (
    <button
      type={type}
      className={`btn-custom ${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      {text}
    </button>
  );
}

export default Button;