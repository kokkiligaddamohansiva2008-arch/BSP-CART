import "./RecentOrders.css";

function RecentOrders() {

  const orders = [
    { id: 1001, customer: "Mohan", total: "$120", status: "Delivered" },
    { id: 1002, customer: "Hemanth", total: "$95", status: "Pending" },
    { id: 1003, customer: "Chakravarthi", total: "$150", status: "Shipped" },
  ];

  return (
    <div className="recent-orders">

      <h3>Recent Orders</h3>

      <table>

        <thead>

          <tr>

            <th>ID</th>

            <th>Customer</th>

            <th>Total</th>

            <th>Status</th>

          </tr>

        </thead>

        <tbody>

          {orders.map((order) => (

            <tr key={order.id}>

              <td>{order.id}</td>

              <td>{order.customer}</td>

              <td>{order.total}</td>

              <td>{order.status}</td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default RecentOrders;