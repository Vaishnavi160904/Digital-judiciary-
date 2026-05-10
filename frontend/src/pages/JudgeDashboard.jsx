import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import "../styles/header-modal.css";

const JudgeDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalCases: 0,
        pendingReview: 0,
        underReview: 0,
        resolved: 0
    });
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState(null);
    const [verdict, setVerdict] = useState("");
    const [showVerdictModal, setShowVerdictModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showDocumentViewer, setShowDocumentViewer] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [userName, setUserName] = useState("");
    const [userRole, setUserRole] = useState("");

    useEffect(() => {
        setUserName(localStorage.getItem("userName") || "Judge");
        setUserRole(localStorage.getItem("role") || "judge");
        fetchJudgeDashboardData();
    }, []);

    const fetchJudgeDashboardData = async () => {
        try {
            const token = localStorage.getItem("token");
            const userId = localStorage.getItem("userId");

            // Fetch all cases (judges can see all cases)
            const casesRes = await fetch(`http://localhost:8000/cases/all`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (casesRes.ok) {
                const casesData = await casesRes.json();
                setCases(casesData);
                
                // Calculate stats
                const stats = {
                    totalCases: casesData.length,
                    pendingReview: casesData.filter(c => c.status === "Pending").length,
                    underReview: casesData.filter(c => c.status === "Under Review").length,
                    resolved: casesData.filter(c => c.status === "Resolved").length
                };
                setStats(stats);
            }
        } catch (error) {
            console.error("Error fetching judge dashboard data:", error);
        } finally {
            setLoading(false);
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

            if (response.ok) {
                alert(`✅ Case status updated to: ${newStatus}`);
                fetchJudgeDashboardData(); // Refresh data
            }
        } catch (error) {
            alert("❌ Failed to update case status");
        }
    };

    const openDetailsModal = (caseItem) => {
        setSelectedCase(caseItem);
        setShowDetailsModal(true);
    };

    const openDocumentViewer = (fileUrl, fileName) => {
        setSelectedDocument({ url: fileUrl, name: fileName });
        setShowDocumentViewer(true);
    };

    const getFileType = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
        if (ext === 'pdf') return 'pdf';
        if (['txt', 'md'].includes(ext)) return 'text';
        return 'other';
    };

    const openVerdictModal = (caseItem) => {
        setSelectedCase(caseItem);
        setShowVerdictModal(true);
    };

    const submitVerdict = async () => {
        if (!verdict.trim()) {
            alert("Please enter a verdict");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            
            const response = await fetch(`http://localhost:8000/cases/${selectedCase._id}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    status: "Resolved",
                    verdict: verdict,
                    judgeId: localStorage.getItem("userId")
                })
            });

            if (response.ok) {
                alert("✅ Verdict submitted successfully!");
                setShowVerdictModal(false);
                setVerdict("");
                setSelectedCase(null);
                fetchJudgeDashboardData();
            }
        } catch (error) {
            alert("❌ Failed to submit verdict");
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            "Pending": "badge-pending",
            "Under Review": "badge-active",
            "Resolved": "badge-resolved",
            "Rejected": "badge-rejected"
        };
        return badges[status] || "badge-default";
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading">Loading Judge Dashboard...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>⚖️ Judge Dashboard</h1>
                <p>Review and manage legal cases</p>
            </div>

            {/* Statistics Cards */}
            <div className="stats-grid">
                <div className="stat-card" style={{borderLeft: "4px solid #3b82f6"}}>
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <h3>{stats.totalCases}</h3>
                        <p>Total Cases</p>
                    </div>
                </div>

                <div className="stat-card" style={{borderLeft: "4px solid #f59e0b"}}>
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                        <h3>{stats.pendingReview}</h3>
                        <p>Pending Review</p>
                    </div>
                </div>

                <div className="stat-card" style={{borderLeft: "4px solid #8b5cf6"}}>
                    <div className="stat-icon">🔍</div>
                    <div className="stat-content">
                        <h3>{stats.underReview}</h3>
                        <p>Under Review</p>
                    </div>
                </div>

                <div className="stat-card" style={{borderLeft: "4px solid #10b981"}}>
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>{stats.resolved}</h3>
                        <p>Resolved</p>
                    </div>
                </div>
            </div>

            {/* Cases Table */}
            <div className="dashboard-card">
                <div className="card-header">
                    <h2>📋 All Cases</h2>
                </div>

                {cases.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">⚖️</div>
                        <h3>No cases available</h3>
                        <p>Cases will appear here when submitted</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="cases-table">
                            <thead>
                                <tr>
                                    <th>Case ID</th>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Submitted By</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cases.map((caseItem) => (
                                    <tr key={caseItem._id}>
                                        <td><strong>{caseItem.caseId}</strong></td>
                                        <td>{caseItem.caseTitle}</td>
                                        <td>
                                            <span className="badge badge-info">
                                                {caseItem.caseType}
                                            </span>
                                        </td>
                                        <td>{caseItem.submittedByName || caseItem.lawyerName || "—"}</td>
                                        <td>{new Date(caseItem.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadge(caseItem.status)}`}>
                                                {caseItem.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                {caseItem.status === "Pending" && (
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => updateCaseStatus(caseItem._id, "Under Review")}
                                                    >
                                                        Start Review
                                                    </button>
                                                )}
                                                {caseItem.status === "Under Review" && (
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => openVerdictModal(caseItem)}
                                                    >
                                                        Submit Verdict
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => openDetailsModal(caseItem)}
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Verdict Modal */}
            {showVerdictModal && (
                <div className="modal-overlay" onClick={() => setShowVerdictModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>⚖️ Submit Verdict</h2>
                            <button 
                                className="modal-close"
                                onClick={() => setShowVerdictModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <p><strong>Case:</strong> {selectedCase?.caseTitle}</p>
                            <p><strong>Case ID:</strong> {selectedCase?.caseId}</p>
                            <p><strong>Type:</strong> {selectedCase?.caseType}</p>
                            
                            <div className="form-group" style={{marginTop: "20px"}}>
                                <label>Verdict/Judgment:</label>
                                <textarea
                                    value={verdict}
                                    onChange={(e) => setVerdict(e.target.value)}
                                    placeholder="Enter your verdict and judgment details..."
                                    rows="8"
                                    className="form-input"
                                    style={{resize: "vertical"}}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn btn-secondary"
                                onClick={() => setShowVerdictModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={submitVerdict}
                            >
                                Submit Verdict
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Case Details Modal */}
            {showDetailsModal && selectedCase && (
                <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                    <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📋 Case Details</h2>
                            <button 
                                className="modal-close"
                                onClick={() => setShowDetailsModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            {/* Case Header */}
                            <div className="case-detail-header">
                                <div className="case-id-badge">
                                    {selectedCase.caseId}
                                </div>
                                <span className={`badge ${getStatusBadge(selectedCase.status)}`}>
                                    {selectedCase.status}
                                </span>
                            </div>

                            <h3 className="case-detail-title">{selectedCase.caseTitle}</h3>

                            {/* Personal Information */}
                            <div className="detail-section">
                                <h4>👤 Personal Information</h4>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Full Name:</span>
                                        <span className="detail-value">{selectedCase.fullName}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Email:</span>
                                        <span className="detail-value">{selectedCase.email}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Phone:</span>
                                        <span className="detail-value">{selectedCase.phoneNumber}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Address:</span>
                                        <span className="detail-value">{selectedCase.address}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Case Information */}
                            <div className="detail-section">
                                <h4>⚖️ Case Information</h4>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Case Type:</span>
                                        <span className="detail-value">
                                            <span className="badge badge-info">{selectedCase.caseType}</span>
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Case Date:</span>
                                        <span className="detail-value">{selectedCase.caseDate}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Urgency:</span>
                                        <span className="detail-value">{selectedCase.urgencyLevel || "Normal"}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Submitted On:</span>
                                        <span className="detail-value">
                                            {new Date(selectedCase.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="detail-item-full">
                                    <span className="detail-label">Description:</span>
                                    <p className="detail-description">{selectedCase.caseDescription}</p>
                                </div>
                            </div>

                            {/* Court Information */}
                            <div className="detail-section">
                                <h4>🏛️ Court Information</h4>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Court:</span>
                                        <span className="detail-value">{selectedCase.court}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">District:</span>
                                        <span className="detail-value">{selectedCase.district}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">State:</span>
                                        <span className="detail-value">{selectedCase.state}</span>
                                    </div>
                                    {selectedCase.policeStation && (
                                        <div className="detail-item">
                                            <span className="detail-label">Police Station:</span>
                                            <span className="detail-value">{selectedCase.policeStation}</span>
                                        </div>
                                    )}
                                    {selectedCase.firNumber && (
                                        <div className="detail-item">
                                            <span className="detail-label">FIR Number:</span>
                                            <span className="detail-value">{selectedCase.firNumber}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* AI Analysis */}
                            {(selectedCase.classification || selectedCase.suggestions || selectedCase.summary) && (
                                <div className="detail-section">
                                    <h4>🤖 AI Analysis</h4>
                                    {selectedCase.classification && (
                                        <div className="ai-analysis-box">
                                            <strong>Classification:</strong>
                                            <p>{selectedCase.classification}</p>
                                        </div>
                                    )}
                                    {selectedCase.suggestions && (
                                        <div className="ai-analysis-box">
                                            <strong>Suggestions:</strong>
                                            <p>{selectedCase.suggestions}</p>
                                        </div>
                                    )}
                                    {selectedCase.summary && (
                                        <div className="ai-analysis-box">
                                            <strong>Summary:</strong>
                                            <p>{selectedCase.summary}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Additional Details */}
                            {(selectedCase.opposingPartyName || selectedCase.lawyerName || selectedCase.evidenceDescription) && (
                                <div className="detail-section">
                                    <h4>📄 Additional Information</h4>
                                    <div className="detail-grid">
                                        {selectedCase.opposingPartyName && (
                                            <div className="detail-item">
                                                <span className="detail-label">Opposing Party:</span>
                                                <span className="detail-value">{selectedCase.opposingPartyName}</span>
                                            </div>
                                        )}
                                        {selectedCase.lawyerName && (
                                            <div className="detail-item">
                                                <span className="detail-label">Lawyer:</span>
                                                <span className="detail-value">{selectedCase.lawyerName}</span>
                                            </div>
                                        )}
                                    </div>
                                    {selectedCase.evidenceDescription && (
                                        <div className="detail-item-full">
                                            <span className="detail-label">Evidence:</span>
                                            <p className="detail-description">{selectedCase.evidenceDescription}</p>
                                        </div>
                                    )}
                                    {selectedCase.witnessDetails && (
                                        <div className="detail-item-full">
                                            <span className="detail-label">Witnesses:</span>
                                            <p className="detail-description">{selectedCase.witnessDetails}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Files */}
                            {selectedCase.uploadedFiles && selectedCase.uploadedFiles.length > 0 && (
                                <div className="detail-section">
                                    <h4>📎 Uploaded Documents</h4>
                                    <div className="files-list">
                                        {selectedCase.uploadedFiles.map((file, index) => (
                                            <div key={index} className="file-item">
                                                <span className="file-icon">📄</span>
                                                <span className="file-name">{file}</span>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => openDocumentViewer(`http://localhost:8000/uploads/${file}`, file)}
                                                    style={{marginLeft: 'auto'}}
                                                >
                                                    👁️ View
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            {selectedCase.status === "Pending" && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        updateCaseStatus(selectedCase._id, "Under Review");
                                    }}
                                >
                                    Start Review
                                </button>
                            )}
                            {selectedCase.status === "Under Review" && (
                                <button
                                    className="btn btn-success"
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        openVerdictModal(selectedCase);
                                    }}
                                >
                                    Submit Verdict
                                </button>
                            )}
                            <button 
                                className="btn btn-secondary"
                                onClick={() => setShowDetailsModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Viewer Modal */}
            {showDocumentViewer && selectedDocument && (
                <div className="modal-overlay" onClick={() => setShowDocumentViewer(false)}>
                    <div className="modal-content modal-xlarge document-viewer-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📄 {selectedDocument.name}</h2>
                            <button 
                                className="modal-close"
                                onClick={() => setShowDocumentViewer(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body document-viewer-body">
                            {getFileType(selectedDocument.name) === 'image' && (
                                <img 
                                    src={selectedDocument.url} 
                                    alt={selectedDocument.name}
                                    className="document-preview-image"
                                />
                            )}
                            {getFileType(selectedDocument.name) === 'pdf' && (
                                <iframe 
                                    src={selectedDocument.url}
                                    className="document-preview-iframe"
                                    title={selectedDocument.name}
                                />
                            )}
                            {getFileType(selectedDocument.name) === 'text' && (
                                <iframe 
                                    src={selectedDocument.url}
                                    className="document-preview-iframe"
                                    title={selectedDocument.name}
                                />
                            )}
                            {getFileType(selectedDocument.name) === 'other' && (
                                <div className="document-preview-fallback">
                                    <div className="fallback-icon">📄</div>
                                    <h3>{selectedDocument.name}</h3>
                                    <p>Preview not available for this file type</p>
                                    <a 
                                        href={selectedDocument.url} 
                                        download 
                                        className="btn btn-primary"
                                        style={{marginTop: '1rem'}}
                                    >
                                        ⬇️ Download File
                                    </a>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <a 
                                href={selectedDocument.url} 
                                download 
                                className="btn btn-primary"
                            >
                                ⬇️ Download
                            </a>
                            <button 
                                className="btn btn-secondary"
                                onClick={() => setShowDocumentViewer(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JudgeDashboard;