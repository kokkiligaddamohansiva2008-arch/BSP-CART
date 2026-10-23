import "../styles/staticPage.css";

function HelpCenter() {
  return (
    <div className="static-page">
      <h1>Help Center</h1>
      <p className="static-subtitle">
        We're here to help. Find answers to common questions below or reach out to our support team.
      </p>

      <h2>Orders & Shipping</h2>
      <p>
        Track your orders anytime from the Orders page after logging in. Most orders ship within
        2-3 business days and delivery times vary by location.
      </p>

      <h2>Returns & Refunds</h2>
      <p>
        Items can be returned within 7 days of delivery. See our Return Policy page for full details
        on eligibility and how to start a return.
      </p>

      <h2>Account & Payments</h2>
      <p>
        Manage your saved addresses, payment methods and profile details from your dashboard.
        If you're having trouble logging in, use the Forgot Password option on the login page.
      </p>

      <h2>Still need help?</h2>
      <p>
        Email us at support@bspcart.com and our team will get back to you within 24 hours.
      </p>
    </div>
  );
}

export default HelpCenter;
