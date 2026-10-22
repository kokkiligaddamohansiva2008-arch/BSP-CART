import "./DashboardCard.css";

function DashboardCard({
  title,
  value,
  icon,
  color = "#2563EB",
}) {
  return (
    <div className="dashboard-card">

      <div
        className="dashboard-icon"
        style={{ background: color }}
      >
        {icon}
      </div>

      <div>

        <h5>{title}</h5>

        <h2>{value}</h2>

      </div>

    </div>
  );
}

export default DashboardCard;