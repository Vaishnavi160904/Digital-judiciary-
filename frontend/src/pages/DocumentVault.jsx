import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

const API_BASE = "http://localhost:8000";

const DocumentVault = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filterCaseId, setFilterCaseId] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        try {
            const token = localStorage.getItem("token");
            const userId = localStorage.getItem("userId");
            const response = await fetch(`${API_BASE}/cases/user/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            if (!response.ok) throw new Error("Failed to fetch cases");
            const data = await response.json();
            setCases(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getDownloadUrl = (caseId, filename) => {
        const token = localStorage.getItem("token");
        return `${API_BASE}/cases/file/${caseId}/${encodeURIComponent(filename)}?token=${token}`;
    };

    const handleDownload = (caseId, filename) => {
        const token = localStorage.getItem("token");
        const url = `${API_BASE}/cases/file/${caseId}/${encodeURIComponent(filename)}`;
        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.blob())
            .then((blob) => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = filename;
                a.click();
                URL.revokeObjectURL(a.href);
            })
            .catch(() => alert("Download failed."));
    };

    const casesWithFiles = cases.filter((c) => c.uploadedFiles && c.uploadedFiles.length > 0);
    const allDocuments = casesWithFiles.flatMap((c) =>
        (c.uploadedFiles || []).map((filename) => ({ caseId: c._id, caseTitle: c.caseTitle, filename }))
    );
    const filteredDocs = filterCaseId
        ? allDocuments.filter((d) => d.caseId === filterCaseId)
        : allDocuments;

    const getFileIcon = (filename) => {
        const ext = (filename || "").split(".").pop().toLowerCase();
        if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "🖼️";
        if (ext === "pdf") return "📄";
        return "📎";
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading-spinner">Loading documents...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>📁 Document Vault</h1>
                <p>All documents attached to your cases</p>
            </div>

            {error && <div className="error-message">⚠️ {error}</div>}

            {casesWithFiles.length > 0 && (
                <div className="vault-filters">
                    <label>
                        Filter by case:
                        <select
                            value={filterCaseId}
                            onChange={(e) => setFilterCaseId(e.target.value)}
                            className="vault-select"
                        >
                            <option value="">All cases</option>
                            {casesWithFiles.map((c) => (
                                <option key={c._id} value={c._id}>
                                    {c.caseTitle || c.caseId || c._id}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            )}

            {allDocuments.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📁</div>
                    <h3>No documents yet</h3>
                    <p>Documents uploaded with case submissions will appear here.</p>
                    <button className="btn-primary" onClick={() => navigate("/case-submit")}>
                        Submit a Case
                    </button>
                </div>
            ) : (
                <div className="vault-document-list">
                    {filteredDocs.map((doc, idx) => (
                        <div key={`${doc.caseId}-${doc.filename}-${idx}`} className="vault-doc-card">
                            <span className="vault-doc-icon">{getFileIcon(doc.filename)}</span>
                            <div className="vault-doc-info">
                                <strong className="vault-doc-name">{doc.filename}</strong>
                                <p className="vault-doc-case">{doc.caseTitle}</p>
                            </div>
                            <div className="vault-doc-actions">
                                <button
                                    className="btn-view"
                                    onClick={() => navigate(`/track-case?id=${doc.caseId}`)}
                                >
                                    View Case
                                </button>
                                <button
                                    className="btn-primary vault-download-btn"
                                    onClick={() => handleDownload(doc.caseId, doc.filename)}
                                >
                                    Download
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DocumentVault;