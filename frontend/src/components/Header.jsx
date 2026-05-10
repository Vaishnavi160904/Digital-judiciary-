import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/header.css";

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState("");
    const [userRole, setUserRole] = useState("");

    const checkAuth = useCallback(() => {
        const token = localStorage.getItem("token");
        const name = localStorage.getItem("userName");
        const role = localStorage.getItem("role");
        if (token) {
            setIsLoggedIn(true);
            setUserName(name || "User");
            setUserRole(role || "");
        } else {
            setIsLoggedIn(false);
            setUserName("");
            setUserRole("");
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth, location.pathname]);

    useEffect(() => {
        const onAuthChange = () => checkAuth();
        window.addEventListener("auth-state-changed", onAuthChange);
        return () => window.removeEventListener("auth-state-changed", onAuthChange);
    }, [checkAuth]);

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            localStorage.clear();
            setIsLoggedIn(false);
            navigate("/login");
        }
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

    const getProfileColor = () => {
        const colors = {
            lawyer: "#3b82f6",
            judge: "#8b5cf6",
            court_staff: "#10b981",
            admin: "#ef4444"
        };
        return colors[userRole] || "#64748b";
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
        <header className="main-header">
            <div className="header-container">
                {/* Logo/Brand */}
                <div className="header-logo">
                    <Link to="/" className="logo-link">
                        <span className="logo-icon">⚖️</span>
                        <span className="logo-text">Digital Judiciary</span>
                    </Link>
                </div>

                {/* Navigation Links */}
                <nav className="header-nav">
                    <Link to="/" className="nav-link">Home</Link>
                    {isLoggedIn && (
                        <>
                            {userRole === "lawyer" && <Link to="/lawyer-dashboard" className="nav-link">Dashboard</Link>}
                            {userRole === "judge" && <Link to="/judge-dashboard" className="nav-link">Dashboard</Link>}
                            {userRole === "court_staff" && <Link to="/staff-dashboard" className="nav-link">Dashboard</Link>}
                            {userRole === "admin" && <Link to="/admin-dashboard" className="nav-link">Dashboard</Link>}
                            <Link to="/case-submit" className="nav-link">Case Submission</Link>
                            <Link to="/case-tracking" className="nav-link">Case Tracking</Link>
                            <Link to="/lawgpt" className="nav-link">LawGPT</Link>
                            {(userRole === "lawyer" || userRole === "court_staff") && (
                                <>
                                    <Link to="/case-schedule" className="nav-link">Schedule</Link>
                                    <Link to="/clients" className="nav-link">Clients</Link>
                                    <Link to="/document-vault" className="nav-link">Documents</Link>
                                </>
                            )}
                        </>
                    )}
                </nav>

                {/* Right Section - Profile or Login */}
                <div className="header-right">
                    {isLoggedIn ? (
                        <>
                            {/* User Profile Section - clickable, goes to Profile page */}
                            <Link to="/profile" className="user-profile-section user-profile-link">
                                <div className="user-info">
                                    <div className="user-name">{userName}</div>
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
                            </Link>

                            {/* Logout Button */}
                            <button 
                                className="logout-button"
                                onClick={handleLogout}
                                title="Logout"
                            >
                                <span className="logout-icon">🚪</span>
                                <span>Logout</span>
                            </button>
                        </>
                    ) : (
                        /* Login Button - Only show when NOT logged in */
                        <Link to="/login" className="login-button">
                            <span>🔐</span>
                            <span>Login</span>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;