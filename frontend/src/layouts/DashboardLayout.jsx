import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="dashboard-wrapper">

      {/* Sidebar */}
      <div className="sidebar">

        {/* Static Logo */}
        <div className="sidebar-header">
          <h2>eCourt</h2>
        </div>

        <div className="sidebar-links">

          {role === "lawyer" && (
            <>
              <Link to="/lawyer-dashboard">Dashboard</Link>
              <Link to="/case-submit">Submit Case</Link>
              <Link to="/my-cases">My Cases</Link>
              <Link to="/case-tracking">Track Case</Link>
              <Link to="/profile">Profile</Link>
            </>
          )}

          {role === "judge" && (
            <>
              <Link to="/judge-dashboard">Dashboard</Link>
              <Link to="/judge-cases">Court Cases</Link>
              <Link to="/profile">Profile</Link>
            </>
          )}

          {role === "court_staff" && (
            <>
              <Link to="/staff-dashboard">Dashboard</Link>
              <Link to="/case-submit">Submit Case</Link>
              <Link to="/update-status">Update Case Status</Link>
              <Link to="/case-tracking">Track Case</Link>
              <Link to="/profile">Profile</Link>
            </>
          )}

          {role === "admin" && (
            <>
              <Link to="/admin-dashboard">Admin Panel</Link>
              <Link to="/profile">Profile</Link>
            </>
          )}

        </div>

        {/* Logout at Bottom */}
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>

      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {children}
      </div>

    </div>
  );
};

export default DashboardLayout;