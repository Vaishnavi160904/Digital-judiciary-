import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

const CaseTracking = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [caseId, setCaseId] = useState(searchParams.get("id") || "");
    const [caseDetails, setCaseDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [allCases, setAllCases] = useState([]);

    useEffect(() => {
        fetchUserCases();
        if (searchParams.get("id")) {
            fetchCaseDetails(searchParams.get("id"));
        }
    }, []);

    const fetchUserCases = async () => {
        try {
            const token = localStorage.getItem("token");
            const userId = localStorage.getItem("userId");

            const response = await fetch(`http://localhost:8000/cases/user/${userId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                const data = await response.json();
                setAllCases(data);
            }
        } catch (err) {
            console.error("Error fetching cases:", err);
        }
    };

    const fetchCaseDetails = async (id) => {
        setLoading(true);
        setError("");
        setCaseDetails(null);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8000/cases/${id}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Case not found or access denied");
            }

            const data = await response.json();
            setCaseDetails(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (caseId.trim()) {
            fetchCaseDetails(caseId.trim());
        }
    };

    const handleSelectCase = (id) => {
        setCaseId(id);
        fetchCaseDetails(id);
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

    const getStatusIcon = (status) => {
        const icons = {
            pending: "⏳",
            active: "⚡",
            resolved: "✅",
            rejected: "❌"
        };
        return icons[status] || "📋";
    };

    return (
        <div className="dashboard-container track-page">
            <section className="track-hero">
                <h1 className="track-title">Track Cases</h1>
                <p className="track-subtitle">Monitor progress and details of your cases</p>
            </section>

            <section className="track-search-card">
                <form onSubmit={handleSearch} className="track-search-form">
                    <span className="track-search-icon" aria-hidden>🔍</span>
                    <input
                        type="text"
                        placeholder="Enter Case ID or search..."
                        value={caseId}
                        onChange={(e) => setCaseId(e.target.value)}
                        className="track-search-input"
                    />
                    <button type="submit" className="track-search-btn">
                        Track Case
                    </button>
                </form>
            </section>

            <section className="track-your-cases">
                <h2 className="track-section-title">Your cases</h2>
                {allCases.length > 0 ? (
                    <div className="track-case-chips">
                        {allCases.slice(0, 8).map((c) => (
                            <button
                                key={c._id}
                                type="button"
                                className={`track-chip ${caseId === c._id ? "active" : ""}`}
                                onClick={() => handleSelectCase(c._id)}
                            >
                                <span className="track-chip-icon">{getStatusIcon(c.status)}</span>
                                <span className="track-chip-text">{c.caseTitle}</span>
                            </button>
                        ))}
                        {allCases.length > 8 && (
                            <button
                                type="button"
                                className="track-chip track-chip-more"
                                onClick={() => navigate("/my-cases")}
                            >
                                View all ({allCases.length})
                            </button>
                        )}
                    </div>
                ) : (
                    <p className="track-no-cases">
                        No cases yet. <button type="button" className="track-inline-link" onClick={() => navigate("/case-submit")}>Submit a case</button> to track it here.
                    </p>
                )}
            </section>

            {error && (
                <div className="track-error">
                    <span className="track-error-icon">⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {loading && (
                <div className="track-loading">
                    <div className="track-spinner" />
                    <p>Fetching case details...</p>
                </div>
            )}

            {/* Case Details Display */}
            {caseDetails && !loading && (
                <div className="case-details-container">
                <div className="case-details-print" id="case-details-print">
                    {/* Case Header */}
                    <div className="case-details-header">
                        <div className="header-left">
                            <h2>{caseDetails.caseTitle}</h2>
                            <div className="case-meta-info">
                                <span className="case-id-display">
                                    Case ID: #{caseDetails.caseId || caseDetails._id.slice(0, 8)}
                                </span>
                                <span className="case-type-badge">
                                    {caseDetails.caseType || "General"}
                                </span>
                            </div>
                        </div>
                        <div className="header-right">
                            <span className={`status-badge-large ${getStatusBadge(caseDetails.status)}`}>
                                {getStatusIcon(caseDetails.status)} {caseDetails.status || "Pending"}
                            </span>
                        </div>
                    </div>

                    {/* Case Timeline */}
                    <div className="case-timeline">
                        <h3>Case Timeline</h3>
                        {caseDetails.status === "rejected" || caseDetails.status === "Rejected" ? (
                            <div className="timeline-track timeline-track-rejected">
                                <div className="timeline-step completed">
                                    <div className="step-circle">📝</div>
                                    <div className="step-label">Submitted</div>
                                    {caseDetails.createdAt && (
                                        <div className="step-date">{new Date(caseDetails.createdAt).toLocaleDateString()}</div>
                                    )}
                                </div>
                                <div className="timeline-step completed">
                                    <div className="step-circle">👨‍⚖️</div>
                                    <div className="step-label">Under Review</div>
                                </div>
                                <div className="timeline-step active">
                                    <div className="step-circle">❌</div>
                                    <div className="step-label">Rejected</div>
                                    {caseDetails.updatedAt && (
                                        <div className="step-date">{new Date(caseDetails.updatedAt).toLocaleDateString()}</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="timeline-track">
                                <div className={`timeline-step ${["pending", "active", "resolved", "rejected"].includes(String(caseDetails.status).toLowerCase()) ? "completed" : ""}`}>
                                    <div className="step-circle">📝</div>
                                    <div className="step-label">Submitted</div>
                                    {caseDetails.createdAt && (
                                        <div className="step-date">{new Date(caseDetails.createdAt).toLocaleDateString()}</div>
                                    )}
                                </div>
                                <div className={`timeline-step ${["active", "resolved"].includes(String(caseDetails.status).toLowerCase()) ? "completed" : String(caseDetails.status).toLowerCase() === "pending" ? "active" : ""}`}>
                                    <div className="step-circle">👨‍⚖️</div>
                                    <div className="step-label">Under Review</div>
                                </div>
                                <div className={`timeline-step ${String(caseDetails.status).toLowerCase() === "active" ? "active" : String(caseDetails.status).toLowerCase() === "resolved" ? "completed" : ""}`}>
                                    <div className="step-circle">⚡</div>
                                    <div className="step-label">Active</div>
                                </div>
                                <div className={`timeline-step ${String(caseDetails.status).toLowerCase() === "resolved" ? "completed" : ""}`}>
                                    <div className="step-circle">✅</div>
                                    <div className="step-label">Resolved</div>
                                    {caseDetails.updatedAt && String(caseDetails.status).toLowerCase() === "resolved" && (
                                        <div className="step-date">{new Date(caseDetails.updatedAt).toLocaleDateString()}</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Case Information Grid */}
                    <div className="case-info-grid">
                        <div className="info-card">
                            <h4>📋 Case Description</h4>
                            <p>{caseDetails.caseDescription}</p>
                        </div>

                        <div className="info-card">
                            <h4>📅 Important Dates</h4>
                            <div className="info-list">
                                <div className="info-item">
                                    <span className="info-label">Filed On:</span>
                                    <span className="info-value">
                                        {new Date(caseDetails.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                {caseDetails.caseDate && (
                                    <div className="info-item">
                                        <span className="info-label">Case Date:</span>
                                        <span className="info-value">
                                            {new Date(caseDetails.caseDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                                <div className="info-item">
                                    <span className="info-label">Last Updated:</span>
                                    <span className="info-value">
                                        {new Date(caseDetails.updatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="info-card">
                            <h4>👤 Applicant Details</h4>
                            <div className="info-list">
                                {caseDetails.fullName && (
                                    <div className="info-item">
                                        <span className="info-label">Name:</span>
                                        <span className="info-value">{caseDetails.fullName}</span>
                                    </div>
                                )}
                                {caseDetails.email && (
                                    <div className="info-item">
                                        <span className="info-label">Email:</span>
                                        <span className="info-value">{caseDetails.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {caseDetails.classification && (
                            <div className="info-card ai-analysis">
                                <h4>🤖 AI Classification</h4>
                                <p>{caseDetails.classification}</p>
                            </div>
                        )}

                        {caseDetails.suggestions && (
                            <div className="info-card ai-analysis">
                                <h4>💡 AI Suggestions</h4>
                                <p>{caseDetails.suggestions}</p>
                            </div>
                        )}

                        {caseDetails.summary && (
                            <div className="info-card ai-analysis">
                                <h4>📄 AI Summary</h4>
                                <p>{caseDetails.summary}</p>
                            </div>
                        )}
                    </div>

                    </div>
                    {/* Action Buttons - hidden when printing */}
                    <div className="case-actions-footer no-print">
                        <button 
                            className="btn-secondary"
                            onClick={() => navigate("/my-cases")}
                        >
                            ← Back to My Cases
                        </button>
                        <button 
                            className="btn-primary"
                            onClick={() => window.print()}
                        >
                            🖨️ Print / Export PDF
                        </button>
                    </div>
                </div>
            )}

            {/* Empty state - no case selected yet */}
            {!caseDetails && !loading && !error && (
                <div className="track-empty">
                    <div className="track-empty-icon-wrap">
                        <span className="track-empty-icon" aria-hidden>🔍</span>
                    </div>
                    <h3>Track your case</h3>
                    <p>Enter a case ID in the search bar or pick one from <strong>Your cases</strong> above to view details.</p>
                </div>
            )}
        </div>
    );
};

export default CaseTracking;