import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

const StaffDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalCases: 0,
        civilCases: 0,
        criminalCases: 0,
        pendingCases: 0
    });
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterType, setFilterType] = useState("All");
    const [filterStatus, setFilterStatus] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [userName, setUserName] = useState("");
    const [userRole, setUserRole] = useState("");
    const [assignedCourt, setAssignedCourt] = useState("");

    useEffect(() => {
        setUserName(localStorage.getItem("userName") || "Staff");
        setUserRole(localStorage.getItem("role") || "court_staff");
        setAssignedCourt(localStorage.getItem("assignedCourt") || "");
        fetchStaffDashboardData();
    }, []);

    const fetchStaffDashboardData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const casesRes = await fetch(`http://localhost:8000/cases/all`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (casesRes.ok) {
                const casesData = await casesRes.json();
                setCases(casesData);
                setStats({
                    totalCases: casesData.length,
                    civilCases: casesData.filter((c) => c.caseType === "Civil").length,
                    criminalCases: casesData.filter((c) => c.caseType === "Criminal").length,
                    pendingCases: casesData.filter((c) => String(c.status).toLowerCase() === "pending").length
                });
            }
        } catch (error) {
            console.error("Error fetching staff dashboard data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const updateCaseStatus = async (caseId, newStatus) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8000/cases/${caseId}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) fetchStaffDashboardData(true);
        } catch (error) {
            console.error(error);
        }
    };

    const updateHearingDate = async (caseId, caseDate) => {
        if (!caseDate || !caseDate.trim()) return;
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8000/cases/${caseId}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ caseDate: caseDate.trim() })
            });
            if (response.ok) fetchStaffDashboardData(true);
        } catch (error) {
            console.error(error);
        }
    };

    const normaliseStatus = (s) => {
        const t = String(s || "").toLowerCase();
        if (t === "pending") return "Pending";
        if (t === "under review") return "Under Review";
        if (t === "resolved") return "Resolved";
        if (t === "rejected") return "Rejected";
        return s || "Pending";
    };

    const getStatusBadge = (status) => {
        const s = String(status || "").toLowerCase();
        const map = {
            pending: "staff-badge-pending",
            "under review": "staff-badge-active",
            resolved: "staff-badge-resolved",
            rejected: "staff-badge-rejected"
        };
        return map[s] || "staff-badge-default";
    };

    const getFilteredCases = () => {
        return cases.filter((c) => {
            const matchType = filterType === "All" || c.caseType === filterType;
            const matchStatus = filterStatus === "All" || String(c.status).toLowerCase() === filterStatus.toLowerCase();
            const term = searchTerm.trim().toLowerCase();
            const matchSearch = !term ||
                (c.caseTitle && c.caseTitle.toLowerCase().includes(term)) ||
                (c.caseId && c.caseId.toLowerCase().includes(term)) ||
                (c.fullName && c.fullName.toLowerCase().includes(term)) ||
                (c.lawyerName && c.lawyerName.toLowerCase().includes(term)) ||
                (c.submittedByName && c.submittedByName.toLowerCase().includes(term));
            return matchType && matchStatus && matchSearch;
        });
    };

    const filteredCases = getFilteredCases();
    const hasActiveFilters = filterType !== "All" || filterStatus !== "All" || searchTerm.trim() !== "";
    const casesToday = cases.filter((c) => new Date(c.createdAt).toDateString() === new Date().toDateString()).length;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const casesThisWeek = cases.filter((c) => new Date(c.createdAt) > weekAgo).length;
    const resolvedThisMonth = cases.filter((c) => String(c.status).toLowerCase() === "resolved" && new Date(c.updatedAt || c.createdAt).getMonth() === new Date().getMonth()).length;

    if (loading) {
        return (
            <div className="dashboard-container staff-dashboard-ui">
                <div className="staff-loading">
                    <div className="staff-spinner" />
                    <p>Loading Court Staff Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container staff-dashboard-ui">
            <section className="staff-hero">
                <div className="staff-hero-text">
                    <h1>Welcome back, <span className="staff-hero-name">{userName}</span></h1>
                    <p>
                        Schedule hearings and update cases for your court
                        {assignedCourt && <span className="staff-hero-court"> · Your court: <strong>{assignedCourt}</strong></span>}
                        {!assignedCourt && <span className="staff-hero-no-court"> · No court assigned (contact admin)</span>}
                    </p>
                    <p className="staff-hero-date">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
                </div>
            </section>

            {/* Stats */}
            <section className="staff-stats">
                <div className="staff-stat-card staff-stat-total">
                    <div className="staff-stat-icon-wrap"><span className="staff-stat-icon">📊</span></div>
                    <div className="staff-stat-body">
                        <span className="staff-stat-value">{stats.totalCases}</span>
                        <span className="staff-stat-label">Total Cases</span>
                    </div>
                </div>
                <div className="staff-stat-card staff-stat-civil">
                    <div className="staff-stat-icon-wrap"><span className="staff-stat-icon">⚖️</span></div>
                    <div className="staff-stat-body">
                        <span className="staff-stat-value">{stats.civilCases}</span>
                        <span className="staff-stat-label">Civil</span>
                    </div>
                </div>
                <div className="staff-stat-card staff-stat-criminal">
                    <div className="staff-stat-icon-wrap"><span className="staff-stat-icon">🚨</span></div>
                    <div className="staff-stat-body">
                        <span className="staff-stat-value">{stats.criminalCases}</span>
                        <span className="staff-stat-label">Criminal</span>
                    </div>
                </div>
                <div className="staff-stat-card staff-stat-pending">
                    <div className="staff-stat-icon-wrap"><span className="staff-stat-icon">⏳</span></div>
                    <div className="staff-stat-body">
                        <span className="staff-stat-value">{stats.pendingCases}</span>
                        <span className="staff-stat-label">Pending</span>
                    </div>
                </div>
            </section>

            {/* Quick stats strip */}
            <div className="staff-quick-strip">
                <span className="staff-quick-item">Today: <strong>{casesToday}</strong></span>
                <span className="staff-quick-item">This week: <strong>{casesThisWeek}</strong></span>
                <span className="staff-quick-item">Resolved this month: <strong>{resolvedThisMonth}</strong></span>
            </div>

            {/* Quick actions - staff only update status & schedule; they do not submit cases */}
            <section className="staff-actions">
                <button type="button" className="staff-action-btn staff-action-secondary" onClick={() => navigate("/case-tracking")}>
                    🔍 Track / View Cases
                </button>
                <button type="button" className="staff-action-btn staff-action-outline" onClick={() => fetchStaffDashboardData(true)} disabled={refreshing}>
                    {refreshing ? "Refreshing…" : "🔄 Refresh list"}
                </button>
            </section>

            {/* Filters */}
            <section className="staff-filters-card">
                <div className="staff-filters-row">
                    <div className="staff-search-wrap">
                        <span className="staff-search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search by case ID, title, lawyer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="staff-search-input"
                        />
                    </div>
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="staff-filter-select">
                        <option value="All">All Types</option>
                        <option value="Civil">Civil</option>
                        <option value="Criminal">Criminal</option>
                        <option value="Corporate">Corporate</option>
                        <option value="Family">Family</option>
                        <option value="Labor">Labor</option>
                    </select>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="staff-filter-select">
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                    {hasActiveFilters && (
                        <button type="button" className="staff-clear-filters" onClick={() => { setFilterType("All"); setFilterStatus("All"); setSearchTerm(""); }}>
                            Clear filters
                        </button>
                    )}
                </div>
                <p className="staff-showing">Showing <strong>{filteredCases.length}</strong> of {cases.length} cases</p>
            </section>

            {/* Cases table */}
            <section className="staff-table-card">
                <div className="staff-table-head">
                    <h2 className="staff-table-title">Cases for your court — Update status & schedule hearings</h2>
                    <button
                        type="button"
                        className="staff-refresh-btn"
                        onClick={() => fetchStaffDashboardData(true)}
                        disabled={refreshing}
                    >
                        {refreshing ? "Refreshing…" : "🔄 Refresh"}
                    </button>
                </div>

                {filteredCases.length === 0 ? (
                    <div className="staff-empty">
                        <div className="staff-empty-icon-wrap">📂</div>
                        <h3>No cases found</h3>
                        <p>Cases are submitted by citizens. Here you can update status and schedule hearing dates for your court only.</p>
                        <p>No cases match your filters. Try clearing filters or wait for new filings.</p>
                        <button type="button" className="staff-empty-btn" onClick={() => { setFilterType("All"); setFilterStatus("All"); setSearchTerm(""); }}>
                            Clear filters
                        </button>
                    </div>
                ) : (
                    <div className="staff-table-wrap">
                        <table className="staff-table">
                            <thead>
                                <tr>
                                    <th>Case ID</th>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Submitted By</th>
                                    <th>Court</th>
                                    <th>Filed</th>
                                    <th>Hearing Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCases.map((caseItem) => (
                                    <tr key={caseItem._id}>
                                        <td className="staff-td-id">{caseItem.caseId}</td>
                                        <td className="staff-td-title">{caseItem.caseTitle}</td>
                                        <td><span className="staff-type-pill">{caseItem.caseType || "—"}</span></td>
                                        <td>{caseItem.submittedByName || caseItem.lawyerName || "—"}</td>
                                        <td className="staff-td-court">{caseItem.court || "—"}</td>
                                        <td>{caseItem.createdAt ? new Date(caseItem.createdAt).toLocaleDateString() : "—"}</td>
                                        <td className="staff-td-hearing">
                                            <input
                                                type="date"
                                                className="staff-hearing-input"
                                                value={caseItem.caseDate ? caseItem.caseDate.split("T")[0] : ""}
                                                onChange={(e) => updateHearingDate(caseItem._id, e.target.value)}
                                                title="Set hearing date"
                                            />
                                        </td>
                                        <td>
                                            <select
                                                className={`staff-status-select ${getStatusBadge(caseItem.status)}`}
                                                value={normaliseStatus(caseItem.status)}
                                                onChange={(e) => updateCaseStatus(caseItem._id, e.target.value)}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Under Review">Under Review</option>
                                                <option value="Resolved">Resolved</option>
                                                <option value="Rejected">Rejected</option>
                                            </select>
                                        </td>
                                        <td>
                                            <div className="staff-row-actions">
                                                <button type="button" className="staff-btn-view" onClick={() => navigate(`/track-case?id=${caseItem._id}`)}>
                                                    View
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

export default StaffDashboard;