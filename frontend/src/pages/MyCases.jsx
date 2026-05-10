import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/dashboard.css";

const MyCases = () => {
    const [cases, setCases] = useState([]);
    const [filteredCases, setFilteredCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterType, setFilterType] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterUrgentOnly, setFilterUrgentOnly] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        fetchCases();
    }, []);

    useEffect(() => {
        if (location.state?.search) setSearchQuery(location.state.search);
        if (location.state?.filterUrgent) setFilterUrgentOnly(true);
    }, [location.state]);

    useEffect(() => {
        applyFilters();
    }, [cases, filterStatus, filterType, searchQuery, filterUrgentOnly]);

    const fetchCases = async () => {
        try {const token = localStorage.getItem("token");
            const userId = localStorage.getItem("userId");

            const response = await fetch(`http://localhost:8000/cases/user/${userId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch cases");
            }

            const data = await response.json();
            setCases(data);
            setFilteredCases(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };const applyFilters = () => {
        let filtered = [...cases];

        // Filter by status
        if (filterStatus !== "all") {
            filtered = filtered.filter(c => c.status === filterStatus);
        }

        // Filter by type
        if (filterType !== "all") {
            filtered = filtered.filter(c => c.caseType === filterType);
        }

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(c =>
                c.caseTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.caseDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.caseId && c.caseId.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Urgent only (from dashboard "View urgent cases")
        if (filterUrgentOnly) {
            filtered = filtered.filter(
                c => c.urgencyLevel === "High" || c.urgencyLevel === "Urgent"
            );
        }

        setFilteredCases(filtered);
    };const getStatusBadge = (status) => {
        const badges = {
            pending: "badge-pending",
            active: "badge-active",
            resolved: "badge-resolved",
            rejected: "badge-rejected"
        };
        return badges[status] || "badge-default";
    };

    const handleDeleteCase = async (caseId) => {
        if (!window.confirm("Are you sure you want to delete this case?")) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8000/cases/${caseId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
if (response.ok) {
                setCases(cases.filter(c => c._id !== caseId));
                alert("Case deleted successfully");
            }
        } catch (err) {
            console.error("Error deleting case:", err);
            alert("Failed to delete case");
        }
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading-spinner">Loading your cases...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>My Cases</h1>
                <p>Manage and track all your submitted cases</p>
            </div>{error && <div className="error-message">⚠️ {error}</div>}

            {/* Filters Section */}
            <div className="filters-section">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="🔍 Search cases by title, description or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filters-row">
                    <div className="filter-group">
                        <label>Status:</label>
                        <select 
                            value={filterStatus} 
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Status</option><option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="resolved">Resolved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Case Type:</label>
                        <select 
                            value={filterType} 
                            onChange={(e) => setFilterType(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Types</option>
                            <option value="Civil">Civil</option>
                            <option value="Criminal">Criminal</option>
                            <option value="Corporate">Corporate</option>
                            <option value="Family">Family</option>
                            <option value="Labor">Labor</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        {filterUrgentOnly ? (
                            <span className="filter-urgent-chip">
                                Urgent only
                                <button
                                    type="button"
                                    className="filter-urgent-clear"
                                    onClick={() => setFilterUrgentOnly(false)}
                                >
                                    ✕
                                </button>
                            </span>
                        ) : (
                            <label className="filter-urgent-label">
                                <input
                                    type="checkbox"
                                    checked={filterUrgentOnly}
                                    onChange={(e) => setFilterUrgentOnly(e.target.checked)}
                                />
                                Urgent only
                            </label>
                        )}
                    </div>

                    <div className="filter-results">
                        <span className="results-count"> Showing {filteredCases.length} of {cases.length} cases
                        </span>
                    </div>
                </div>
            </div>

            {/* Cases Grid */}
            {filteredCases.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📂</div>
                    <h3>No cases found</h3>
                    <p>
                        {cases.length === 0 
                            ? "You haven't submitted any cases yet" 
                            : "No cases match your current filters"}
                    </p>
                    {cases.length === 0 && (
                        <button 
                            className="btn-primary"
                            onClick={() => navigate("/case-submit")}
                        >
                            Submit Your First Case
                        </button>
                    )}</div>
            ) : (
                <div className="cases-grid">
                    {filteredCases.map((caseItem) => (
                        <div key={caseItem._id} className="case-card">
                            <div className="case-card-header">
                                <div className="case-id-badge">
                                    #{caseItem.caseId || caseItem._id.slice(0, 8)}
                                </div>
                                <span className={`status-badge ${getStatusBadge(caseItem.status)}`}>
                                    {caseItem.status || "Pending"}
                                </span>
                            </div>

                            <h3 className="case-card-title">{caseItem.caseTitle}</h3>
                            
                            <p className="case-card-description">
                                {caseItem.caseDescription.length > 150 
                                    ? caseItem.caseDescription.substring(0, 150) + "..." 
                                    : caseItem.caseDescription}
                            </p>

                            <div className="case-card-meta">
                                <div className="meta-item">
                                    <span className="meta-label">Type:</span><span className="case-type-badge">
                                        {caseItem.caseType || "General"}
                                    </span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">Filed:</span>
                                    <span className="meta-value">
                                        {new Date(caseItem.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {caseItem.classification && (
                                <div className="case-classification">
                                    <strong>Classification:</strong> {caseItem.classification}
                                </div>
                            )}

                            <div className="case-card-actions">
                                <button 
                                    className="btn-view"
                                    onClick={() => navigate(`/track-case?id=${caseItem._id}`)}
>
                                    View Details
                                </button>
                                <button 
                                    className="btn-delete"
                                    onClick={() => handleDeleteCase(caseItem._id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default MyCases;