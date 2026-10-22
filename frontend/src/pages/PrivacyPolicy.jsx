import "../styles/staticPage.css";

function PrivacyPolicy() {
  return (
    <div className="static-page">
      <h1>Privacy Policy</h1>
      <p className="static-subtitle">Last updated: January 2026</p>

      <h2>Information We Collect</h2>
      <p>
        We collect information you provide when creating an account, placing an order, or
        contacting support - such as your name, email, phone number, shipping address and
        payment details.
      </p>

      <h2>How We Use Your Information</h2>
      <ul>
        <li>To process and deliver your orders</li>
        <li>To communicate order updates and support responses</li>
        <li>To personalize product recommendations</li>
        <li>To improve our platform and prevent fraud</li>
      </ul>

      <h2>Data Sharing</h2>
      <p>
        We do not sell your personal data. Information may be shared with delivery partners
        and payment processors solely to fulfil your orders.
      </p>

      <h2>Your Rights</h2>
      <p>
        You can request access to, correction of, or deletion of your personal data at any
        time by contacting support@bspcart.com.
      </p>
    </div>
  );
}

export default PrivacyPolicy;
