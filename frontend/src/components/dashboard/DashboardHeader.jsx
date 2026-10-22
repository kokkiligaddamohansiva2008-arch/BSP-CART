import "./DashboardHeader.css";

function DashboardHeader({ title, subtitle }) {
  return (
    <div className="dashboard-header">

      <div>

        <h1>{title}</h1>

        <p>{subtitle}</p>

      </div>

    </div>
  );
}

export default DashboardHeader;