import "./Transactions.css";

function Transactions() {

  const data = [
    {
      id: "TX1001",
      amount: "$250",
      status: "Completed",
    },
    {
      id: "TX1002",
      amount: "$430",
      status: "Pending",
    },
    {
      id: "TX1003",
      amount: "$150",
      status: "Completed",
    },
    {
      id: "TX1004",
      amount: "$90",
      status: "Refunded",
    },
  ];

  return (

    <div className="transactions">

      <h3>Latest Transactions</h3>

      <table>

        <thead>

          <tr>

            <th>ID</th>
            <th>Amount</th>
            <th>Status</th>

          </tr>

        </thead>

        <tbody>

          {data.map((item) => (

            <tr key={item.id}>

              <td>{item.id}</td>

              <td>{item.amount}</td>

              <td>{item.status}</td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}

export default Transactions;