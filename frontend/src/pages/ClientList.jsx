import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

const ClientList = () => {
    const [cases, setCases] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        fetchCases();
    }, []);

    useEffect(() => {
        if (cases.length === 0) {
            setClients([]);
            return;
        }
        const map = new Map();
        cases.forEach((c) => {
            const key = `${(c.fullName || "").trim().toLowerCase()}|${(c.email || "").trim().toLowerCase()}`;
            if (!key.includes("|") || !c.fullName) return;
            if (!map.has(key)) {
                map.set(key, {
                    fullName: c.fullName,
                    email: c.email,
                    phoneNumber: c.phoneNumber,
                    address: c.address,
                    caseIds: [],
                    caseTitles: []
                });
            }
            const client = map.get(key);
            if (c._id && !client.caseIds.includes(c._id)) {
                client.caseIds.push(c._id);
                client.caseTitles.push(c.caseTitle || "Untitled");
            }
        });
        setClients(Array.from(map.values()).sort((a, b) => (a.fullName || "").localeCompare(b.fullName || "")));
    }, [cases]);

    const fetchCases = async () => {
        try {
            const token = localStorage.getItem("token");
            const userId = localStorage.getItem("userId");
            const response = await fetch(`http://localhost:8000/cases/user/${userId}`, {
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

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading-spinner">Loading clients...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-container client-list-page">
            <section className="client-list-hero">
                <h1 className="client-list-title">Client List</h1>
                <p className="client-list-subtitle">Clients from your submitted cases</p>
            </section>

            {error && (
                <div className="track-error">
                    <span className="track-error-icon">⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {clients.length === 0 ? (
                <div className="client-list-empty">
                    <div className="client-list-empty-icon-wrap">
                        <span className="client-list-empty-icon" aria-hidden>👥</span>
                    </div>
                    <h3>No clients yet</h3>
                    <p>Clients appear here when you submit cases with applicant details.</p>
                    <button
                        type="button"
                        className="client-list-cta"
                        onClick={() => navigate("/case-submit")}
                    >
                        Submit a Case
                    </button>
                </div>
            ) : (
                <div className="client-list-grid">
                    {clients.map((client, idx) => (
                        <div key={idx} className="client-list-card">
                            <div className="client-list-card-top">
                                <span className="client-list-initials">
                                    {(client.fullName || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                                </span>
                                <span className="client-list-badge">{client.caseIds.length} case{client.caseIds.length !== 1 ? "s" : ""}</span>
                            </div>
                            <h3 className="client-list-name">{client.fullName}</h3>
                            {client.email && <p className="client-list-line">📧 {client.email}</p>}
                            {client.phoneNumber && <p className="client-list-line">📞 {client.phoneNumber}</p>}
                            {client.address && <p className="client-list-line client-list-address">📍 {client.address}</p>}
                            <div className="client-list-chips">
                                {client.caseTitles.slice(0, 3).map((title, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        className="client-list-chip"
                                        onClick={() => navigate(`/track-case?id=${client.caseIds[i]}`)}
                                    >
                                        {title.length > 28 ? title.slice(0, 28) + "…" : title}
                                    </button>
                                ))}
                                {client.caseTitles.length > 3 && (
                                    <span className="client-list-more">+{client.caseTitles.length - 3} more</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientList;