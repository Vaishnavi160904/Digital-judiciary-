import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

const LawyerDashboard = () => {
    const [stats, setStats] = useState({
        totalCases: 0,
        pendingCases: 0,
        resolvedCases: 0,
        activeCases: 0
    });
    const [recentCases, setRecentCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [userName, setUserName] = useState("");
    const [userRole, setUserRole] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        setUserName(localStorage.getItem("userName") || "Lawyer");
        setUserRole(localStorage.getItem("role") || "lawyer");
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem("token");
            const userId = localStorage.getItem("userId");

            // Fetch case statistics
            const statsRes = await fetch(`http://localhost:8000/cases/stats/${userId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            // Fetch recent cases (get more for upcoming/urgent sections)
            const casesRes = await fetch(`http://localhost:8000/cases/recent/${userId}?limit=20`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (casesRes.ok) {
                const casesData = await casesRes.json();
                setRecentCases(casesData);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: "badge-pending",
            active: "badge-active",
            resolved: "badge-resolved",
            rejected: "badge-rejected"
        };
        return badges[status] || "badge-default";
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate("/my-cases", { state: { search: searchQuery.trim() } });
        } else {
            navigate("/my-cases");
        }
    };

    // Urgent cases (High / Urgent urgency level, and not resolved)
    const urgentCases = recentCases.filter(
        (c) =>
            (c.urgencyLevel === "High" || c.urgencyLevel === "Urgent") &&
            c.status !== "resolved" &&
            c.status !== "Resolved"
    );

    // Upcoming: cases with caseDate in the future, sorted by date (show next 5)
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const upcomingCases = recentCases
        .filter((c) => {
            if (!c.caseDate) return false;
            const d = new Date(c.caseDate);
            return d >= now && c.status !== "resolved" && c.status !== "Resolved";
        })
        .sort((a, b) => new Date(a.caseDate) - new Date(b.caseDate))
        .slice(0, 5);

    // Deadline reminders: hearings in the next 7 days
    const deadlineCases = recentCases
        .filter((c) => {
            if (!c.caseDate) return false;
            const d = new Date(c.caseDate);
            return d >= now && d <= sevenDaysFromNow && c.status !== "resolved" && c.status !== "Resolved";
        })
        .sort((a, b) => new Date(a.caseDate) - new Date(b.caseDate));

    // Recent cases for the table (first 5)
    const recentTableCases = recentCases.slice(0, 5);

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading-spinner">Loading...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-container lawyer-dashboard-ui">
            {/* Hero + Search */}
            <section className="lawyer-hero">
                <div className="lawyer-hero-text">
                    <h1>Welcome back, <span className="lawyer-hero-name">{userName}</span></h1>
                    <p>Manage your cases and stay on top of hearings and deadlines.</p>
                </div>
                <form className="lawyer-search-card" onSubmit={handleSearch}>
                    <span className="lawyer-search-icon" aria-hidden>🔍</span>
                    <input
                        type="text"
                        placeholder="Search cases by title, description, or case ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="lawyer-search-input"
                    />
                    <button type="submit" className="lawyer-search-btn">
                        Search
                    </button>
                </form>
            </section>

            {/* Urgent strip */}
            {urgentCases.length > 0 && (
                <div className="lawyer-urgent-strip">
                    <span className="lawyer-urgent-icon">⚠️</span>
                    <span className="lawyer-urgent-text">
                        You have <strong>{urgentCases.length}</strong> urgent case{urgentCases.length !== 1 ? "s" : ""} requiring attention.
                    </span>
                    <button
                        className="lawyer-urgent-btn"
                        onClick={() => navigate("/my-cases", { state: { filterUrgent: true } })}
                    >
                        View urgent cases →
                    </button>
                </div>
            )}

            {/* Stats */}
            <section className="lawyer-stats">
                <div className="lawyer-stat-card lawyer-stat-total">
                    <div className="lawyer-stat-icon-wrap">
                        <span className="lawyer-stat-icon">📊</span>
                    </div>
                    <div className="lawyer-stat-body">
                        <span className="lawyer-stat-value">{stats.totalCases}</span>
                        <span className="lawyer-stat-label">Total Cases</span>
                    </div>
                </div>
                <div className="lawyer-stat-card lawyer-stat-pending">
                    <div className="lawyer-stat-icon-wrap">
                        <span className="lawyer-stat-icon">⏳</span>
                    </div>
                    <div className="lawyer-stat-body">
                        <span className="lawyer-stat-value">{stats.pendingCases}</span>
                        <span className="lawyer-stat-label">Pending</span>
                    </div>
                </div>
                <div className="lawyer-stat-card lawyer-stat-resolved">
                    <div className="lawyer-stat-icon-wrap">
                        <span className="lawyer-stat-icon">✅</span>
                    </div>
                    <div className="lawyer-stat-body">
                        <span className="lawyer-stat-value">{stats.resolvedCases}</span>
                        <span className="lawyer-stat-label">Resolved</span>
                    </div>
                </div>
                <div className="lawyer-stat-card lawyer-stat-active">
                    <div className="lawyer-stat-icon-wrap">
                        <span className="lawyer-stat-icon">🔥</span>
                    </div>
                    <div className="lawyer-stat-body">
                        <span className="lawyer-stat-value">{stats.activeCases}</span>
                        <span className="lawyer-stat-label">Active</span>
                    </div>
                </div>
            </section>

            <div className="lawyer-dashboard-grid">
                {/* Left: Quick Actions + shortcuts + LawGPT */}
                <div className="lawyer-actions-section">
                    <section className="lawyer-quick-actions-card">
                        <h2 className="lawyer-card-title">Quick Actions</h2>
                        <div className="lawyer-action-buttons">
                            <button
                                className="lawyer-action-btn lawyer-action-primary"
                                onClick={() => navigate("/case-submit")}
                            >
                                <span className="lawyer-action-icon">📝</span>
                                <span>Submit New Case</span>
                            </button>
                            <button
                                className="lawyer-action-btn lawyer-action-success"
                                onClick={() => navigate("/my-cases")}
                            >
                                <span className="lawyer-action-icon">📂</span>
                                <span>View All Cases</span>
                            </button>
                            <button
                                className="lawyer-action-btn lawyer-action-secondary"
                                onClick={() => navigate("/track-case")}
                            >
                                <span className="lawyer-action-icon">🔍</span>
                                <span>Track Cases</span>
                            </button>
                        </div>
                        <div className="lawyer-shortcuts">
                            <span className="lawyer-shortcuts-label">Shortcuts</span>
                            <button type="button" className="lawyer-shortcut-pill" onClick={() => navigate("/case-schedule")}>
                                📅 Schedule
                            </button>
                            <button type="button" className="lawyer-shortcut-pill" onClick={() => navigate("/clients")}>
                                👥 Clients
                            </button>
                            <button type="button" className="lawyer-shortcut-pill" onClick={() => navigate("/document-vault")}>
                                📁 Documents
                            </button>
                        </div>
                    </section>

                    {deadlineCases.length > 0 && (
                        <div className="lawyer-card lawyer-deadlines-card">
                            <h2 className="lawyer-card-title">⏰ Deadlines (next 7 days)</h2>
                            <ul className="lawyer-upcoming-list">
                                {deadlineCases.slice(0, 5).map((c) => (
                                    <li key={c._id} className="lawyer-upcoming-item lawyer-deadline-item">
                                        <div>
                                            <strong>{c.caseTitle}</strong>
                                            <span className="lawyer-upcoming-date">
                                                {new Date(c.caseDate).toLocaleDateString(undefined, {
                                                    weekday: "short",
                                                    month: "short",
                                                    day: "numeric"
                                                })}
                                            </span>
                                        </div>
                                        <button
                                            className="btn-view btn-view-sm"
                                            onClick={() => navigate(`/track-case?id=${c._id}`)}
                                        >
                                            View
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <button type="button" className="view-all-btn" onClick={() => navigate("/case-schedule")}>
                                Full schedule →
                            </button>
                        </div>
                    )}

                    <div className="lawyer-lawgpt-card" onClick={() => navigate("/lawgpt")}>
                        <div className="lawyer-lawgpt-icon">🤖</div>
                        <div className="lawyer-lawgpt-content">
                            <h3>LawGPT Assistant</h3>
                            <p>Get instant legal research, case analysis, and document help with AI.</p>
                            <span className="lawyer-lawgpt-link">Open LawGPT →</span>
                        </div>
                    </div>

                    {upcomingCases.length > 0 && (
                        <div className="lawyer-card lawyer-upcoming-card">
                            <h2 className="lawyer-card-title">📅 Upcoming Hearings</h2>
                            <ul className="lawyer-upcoming-list">
                                {upcomingCases.map((c) => (
                                    <li key={c._id} className="lawyer-upcoming-item">
                                        <div>
                                            <strong>{c.caseTitle}</strong>
                                            <span className="lawyer-upcoming-date">
                                                {new Date(c.caseDate).toLocaleDateString(undefined, {
                                                    weekday: "short",
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric"
                                                })}
                                            </span>
                                        </div>
                                        <button
                                            className="btn-view btn-view-sm"
                                            onClick={() => navigate(`/track-case?id=${c._id}`)}
                                        >
                                            View
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <button
                                className="view-all-btn"
                                onClick={() => navigate("/my-cases")}
                            >
                                View all cases →
                            </button>
                        </div>
                    )}
                </div>

                {/* Recent Cases */}
                <section className="lawyer-recent-section">
                    <div className="lawyer-section-head">
                        <h2 className="lawyer-card-title">Recent Cases</h2>
                        <button type="button" className="lawyer-view-all" onClick={() => navigate("/my-cases")}>
                            View All →
                        </button>
                    </div>

                    {recentTableCases.length === 0 ? (
                        <div className="lawyer-empty-state">
                            <div className="lawyer-empty-icon-wrap">
                                <span className="lawyer-empty-icon" aria-hidden>📋</span>
                            </div>
                            <h3>No cases yet</h3>
                            <p>Submit your first case to start tracking and managing it here.</p>
                            <button
                                className="lawyer-cta-btn"
                                onClick={() => navigate("/case-submit")}
                            >
                                Submit your first case
                            </button>
                        </div>
                    ) : (
                        <div className="cases-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Case ID</th>
                                        <th>Title</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTableCases.map((caseItem) => (
                                        <tr key={caseItem._id}>
                                            <td className="case-id">
                                                {caseItem.caseId || caseItem._id?.slice(0, 8)}
                                            </td>
                                            <td className="case-title">{caseItem.caseTitle}</td>
                                            <td>
                                                <span className="case-type-badge">
                                                    {caseItem.caseType || "General"}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${getStatusBadge(caseItem.status)}`}>
                                                    {caseItem.status || "Pending"}
                                                </span>
                                            </td>
                                            <td>
                                                {caseItem.createdAt
                                                    ? new Date(caseItem.createdAt).toLocaleDateString()
                                                    : "—"}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn-view"
                                                    onClick={() => navigate(`/track-case?id=${caseItem._id}`)}
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default LawyerDashboard;