import "../styles/staticPage.css";

const faqs = [
  {
    q: "How do I track my order?",
    a: "Go to Orders after logging in to see the live status of every order you've placed.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept UPI, credit/debit cards, net banking and cash on delivery for eligible orders.",
  },
  {
    q: "Can I cancel an order after placing it?",
    a: "Yes, orders can be cancelled from the Orders page as long as they haven't shipped yet.",
  },
  {
    q: "How do I become a seller on BSP CART?",
    a: "Register for an account and select Seller as your role during sign up to get access to the seller dashboard.",
  },
  {
    q: "Is my payment information secure?",
    a: "Yes, all payments are processed through secure, encrypted channels and we never store your full card details.",
  },
];

function FAQs() {
  return (
    <div className="static-page">
      <h1>Frequently Asked Questions</h1>
      <p className="static-subtitle">
        Quick answers to the things buyers and sellers ask us most.
      </p>

      {faqs.map((item, i) => (
        <details className="faq-item" key={i}>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export default FAQs;
