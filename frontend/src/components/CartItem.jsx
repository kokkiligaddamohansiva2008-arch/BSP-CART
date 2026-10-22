import defaultImage from "../assets/default-Product.png";

function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  const { id, name, image, price, quantity, stock } = item;
  const atMax = stock && quantity >= stock;

  return (
    <article className="cart-line">
      <img
        src={image || defaultImage}
        alt={name}
        className="cart-line-img"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = defaultImage;
        }}
      />

      <div className="cart-line-info">
        <h3>{name}</h3>
        <div className="cart-line-price">₹{price.toLocaleString("en-IN")}</div>
        {stock > 0 && stock < 10 && (
          <span className="cart-line-low">Only {stock} left</span>
        )}
        <button
          type="button"
          className="cart-line-remove"
          onClick={() => onRemove(id)}
        >
          Remove
        </button>
      </div>

      <div className="cart-line-qty" role="group" aria-label={`Quantity for ${name}`}>
        <button
          type="button"
          aria-label={`Decrease ${name} quantity`}
          onClick={() => onDecrease(id)}
          disabled={quantity <= 1}
        >
          −
        </button>
        <span aria-live="polite">{quantity}</span>
        <button
          type="button"
          aria-label={`Increase ${name} quantity`}
          onClick={() => onIncrease(id)}
          disabled={atMax}
        >
          +
        </button>
      </div>

      <div className="cart-line-sub">
        <small>Subtotal</small>
        <strong>₹{(price * quantity).toLocaleString("en-IN")}</strong>
      </div>
    </article>
  );
}

export default CartItem;
