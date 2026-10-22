
import "./RecentUsers.css";

function RecentUsers() {

  const users = [
    {
      id: 1,
      name: "Mohan",
      role: "Buyer",
      email: "mohan@gmail.com",
    },
    {
      id: 2,
      name: "Hemanth",
      role: "Seller",
      email: "hemanth@gmail.com",
    },
    {
      id: 3,
      name: "Ravi",
      role: "Buyer",
      email: "ravi@gmail.com",
    },
    {
      id: 4,
      name: "Siva",
      role: "Admin",
      email: "admin@bspcart.com",
    },
  ];

  return (
    <div className="recent-users">

      <h3>Recent Users</h3>

      <table>

        <thead>

          <tr>

            <th>Name</th>
            <th>Role</th>
            <th>Email</th>

          </tr>

        </thead>

        <tbody>

          {users.map((user) => (

            <tr key={user.id}>

              <td>{user.name}</td>

              <td>{user.role}</td>

              <td>{user.email}</td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default RecentUsers;