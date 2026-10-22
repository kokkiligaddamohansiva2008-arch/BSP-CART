import "../styles/staticPage.css";

function ReturnPolicy() {
  return (
    <div className="static-page">
      <h1>Return Policy</h1>
      <p className="static-subtitle">
        Not happy with your order? Here's how returns work on BSP CART.
      </p>

      <h2>Return Window</h2>
      <p>
        Most items can be returned within 7 days of delivery, provided they are unused and in
        their original packaging.
      </p>

      <h2>Non-Returnable Items</h2>
      <ul>
        <li>Perishable goods</li>
        <li>Personal care and hygiene products</li>
        <li>Items marked as "Non-Returnable" on the product page</li>
      </ul>

      <h2>How to Start a Return</h2>
      <p>
        Go to Orders, select the item you want to return, and choose "Return Item." Once
        approved, a pickup will be scheduled and your refund will be processed after inspection.
      </p>

      <h2>Refund Timeline</h2>
      <p>
        Refunds are issued to your original payment method within 5-7 business days after the
        returned item is received.
      </p>
    </div>
  );
}

export default ReturnPolicy;
