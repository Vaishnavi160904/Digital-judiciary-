import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

const DashboardHeader = ({ userName, userRole }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            localStorage.clear();
            navigate("/login");
        }
    };

    const getProfileColor = () => {
        const colors = {
            lawyer: "#3b82f6",
            judge: "#8b5cf6",
            court_staff: "#10b981",
            admin: "#ef4444"
        };
        return colors[userRole] || "#64748b";
    };

    const getInitials = (name) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getRoleBadge = (role) => {
        const badges = {
            lawyer: { text: "Lawyer", icon: "👨‍⚖️", color: "#3b82f6" },
            judge: { text: "Judge", icon: "⚖️", color: "#8b5cf6" },
            court_staff: { text: "Court Staff", icon: "👨‍💼", color: "#10b981" },
            admin: { text: "Admin", icon: "👑", color: "#ef4444" }
        };
        return badges[role] || { text: role, icon: "👤", color: "#64748b" };
    };

    const badge = getRoleBadge(userRole);

    return (
        <div className="dashboard-top-header">
            <div className="header-left">
                <div className="app-logo">⚖️ Digital Judiciary</div>
            </div>
            
            <div className="header-right">
                <div className="user-info-section">
                    <div className="user-details">
                        <div className="user-name">{userName || "User"}</div>
                        <div className="user-role-badge" style={{background: badge.color}}>
                            <span>{badge.icon}</span>
                            <span>{badge.text}</span>
                        </div>
                    </div>
                    <div 
                        className="user-avatar" 
                        style={{background: getProfileColor()}}
                        title={userName}
                    >
                        {getInitials(userName)}
                    </div>
                </div>
                
                <button 
                    className="logout-btn"
                    onClick={handleLogout}
                    title="Logout"
                >
                    <span className="logout-icon">🚪</span>
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default DashboardHeader;