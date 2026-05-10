import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

const Profile = () => {
    const [user, setUser] = useState({
        fullName: "",
        email: "",
        role: ""
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        fullName: ""
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            
            if (!token) {
                navigate("/login");
                return;
            }

            const response = await fetch("http://localhost:8000/auth/me", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch profile");
            }

            const data = await response.json();
            setUser(data);
            setFormData({ fullName: data.fullName });
        } catch (err) {
            setError(err.message);
            if (err.message.includes("authentication")) {
                navigate("/login");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:8000/auth/update-profile", {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUser(updatedUser);
                setEditMode(false);
                alert("Profile updated successfully!");
            } else {
                throw new Error("Failed to update profile");
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("role");
        navigate("/login");
    };

    const getRoleBadgeClass = (role) => {
        const roleClasses = {
            lawyer: "badge-active",
            judge: "badge-resolved",
            court_staff: "badge-pending",
            admin: "badge-rejected"
        };
        return roleClasses[role] || "badge-default";
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading-spinner">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="case-submission-wrapper">
                <div className="dashboard-header">
                    <h1>👤 My Profile</h1>
                    <p>View and manage your account information</p>
                </div>

                {error && (
                    <div className="error-message-box">
                        <span className="error-icon">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <div className="case-form-container">
                    {!editMode ? (
                        // View Mode
                        <div className="profile-view">
                            <div className="profile-header">
                                <div className="profile-avatar">
                                    <span className="avatar-text">
                                        {user.fullName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="profile-info">
                                    <h2>{user.fullName}</h2>
                                    <span className={`status-badge ${getRoleBadgeClass(user.role)}`}>
                                        {user.role.replace("_", " ").toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div className="profile-details">
                                <div className="detail-row">
                                    <div className="detail-label">
                                        <span className="label-icon">📧</span>
                                        Email Address
                                    </div>
                                    <div className="detail-value">{user.email}</div>
                                </div>

                                <div className="detail-row">
                                    <div className="detail-label">
                                        <span className="label-icon">👤</span>
                                        Full Name
                                    </div>
                                    <div className="detail-value">{user.fullName}</div>
                                </div>

                                <div className="detail-row">
                                    <div className="detail-label">
                                        <span className="label-icon">🎭</span>
                                        Role
                                    </div>
                                    <div className="detail-value">
                                        {user.role.replace("_", " ").charAt(0).toUpperCase() + 
                                         user.role.replace("_", " ").slice(1)}
                                    </div>
                                </div>

                                <div className="detail-row">
                                    <div className="detail-label">
                                        <span className="label-icon">🆔</span>
                                        User ID
                                    </div>
                                    <div className="detail-value" style={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                                        {user.id}
                                    </div>
                                </div>
                            </div>

                            <div className="profile-actions">
                                <button 
                                    className="btn-secondary"
                                    onClick={() => navigate(-1)}
                                >
                                    ← Back
                                </button>
                                <button 
                                    className="btn-primary"
                                    onClick={() => setEditMode(true)}
                                >
                                    ✏️ Edit Profile
                                </button>
                                <button 
                                    className="btn-delete"
                                    onClick={handleLogout}
                                >
                                    🚪 Logout
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Edit Mode
                        <form onSubmit={handleUpdate} className="case-submission-form">
                            <h3 style={{ marginBottom: "1.5rem" }}>Edit Profile</h3>

                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">👤</span>
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                    className="form-input"
                                    placeholder="Enter your full name"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">📧</span>
                                    Email Address (Cannot be changed)
                                </label>
                                <input
                                    type="email"
                                    value={user.email}
                                    disabled
                                    className="form-input"
                                    style={{ backgroundColor: "#f1f5f9", cursor: "not-allowed" }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">🎭</span>
                                    Role (Cannot be changed)
                                </label>
                                <input
                                    type="text"
                                    value={user.role.replace("_", " ").charAt(0).toUpperCase() + 
                                           user.role.replace("_", " ").slice(1)}
                                    disabled
                                    className="form-input"
                                    style={{ backgroundColor: "#f1f5f9", cursor: "not-allowed" }}
                                />
                            </div>

                            <div className="form-actions">
                                <button 
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => {
                                        setEditMode(false);
                                        setFormData({ fullName: user.fullName });
                                    }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="btn-primary"
                                >
                                    💾 Save Changes
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="profile-stats" style={{ marginTop: "2rem" }}>
                    <h3 style={{ marginBottom: "1rem" }}>Quick Access</h3>
                    <div className="action-buttons">
                        <button 
                            className="action-btn action-btn-primary"
                            onClick={() => navigate("/case-submit")}
                        >
                            <span className="btn-icon">📝</span>
                            <span>Submit Case</span>
                        </button>
                        <button 
                            className="action-btn action-btn-secondary"
                            onClick={() => navigate("/my-cases")}
                        >
                            <span className="btn-icon">📂</span>
                            <span>My Cases</span>
                        </button>
                        <button 
                            className="action-btn action-btn-tertiary"
                            onClick={() => navigate("/track-case")}
                        >
                            <span className="btn-icon">🔍</span>
                            <span>Track Case</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;