import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

const COURT_OPTIONS = [
    "Madurai District Court",
    "Sivagangai Old Court",
    "Chennai High Court",
    "Coimbatore District Court",
    "Trichy District Court",
    "Salem District Court",
    "District Court",
    "High Court"
];

const CaseSubmission = () => {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phoneNumber: "",
        address: "",
        caseTitle: "",
        caseDescription: "",
        caseType: "Civil",
        caseDate: "",
        court: "",
        district: "",
        state: "",
        policeStation: "",
        firNumber: "",
        opposingPartyName: "",
        opposingPartyAddress: "",
        lawyerName: "",
        evidenceDescription: "",
        witnessDetails: "",
        urgencyLevel: "Normal"
    });
    
    const [files, setFiles] = useState([]);
    const [response, setResponse] = useState({ 
        classification: "", 
        suggestions: "", 
        summary: "" 
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles([...files, ...selectedFiles]);
    };

    const removeFile = (index) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);
        
        try {
            const token = localStorage.getItem("token");
            const userId = localStorage.getItem("userId");

            // Create FormData for file upload
            const submitData = new FormData();
            
            // Add all form fields
            Object.keys(formData).forEach(key => {
                submitData.append(key, formData[key]);
            });
            
            submitData.append("userId", userId);
            
            // Add files
            files.forEach((file, index) => {
                submitData.append(`files`, file);
            });

            const res = await fetch("http://localhost:8000/cases/submit", {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`
                    // Don't set Content-Type header - browser will set it with boundary for FormData
                },
                body: submitData
            });

            if (!res.ok) {
                const errorData = await res.json();
                
                // Handle validation errors (422)
                if (Array.isArray(errorData.detail)) {
                    const errorMessages = errorData.detail
                        .map(err => `${err.loc.join(' → ')}: ${err.msg}`)
                        .join('\n');
                    throw new Error(errorMessages);
                }
                
                // Handle string errors
                throw new Error(errorData.detail || errorData.message || "Failed to process case.");
            }

            const data = await res.json();
            setResponse({
                classification: data.classification || "",
                suggestions: data.suggestions || "",
                summary: data.summary || ""
            });
            setSuccess(true);

            // Clear form after successful submission
            setTimeout(() => {
                setFormData({
                    fullName: "",
                    email: "",
                    phoneNumber: "",
                    address: "",
                    caseTitle: "",
                    caseDescription: "",
                    caseType: "Civil",
                    caseDate: "",
                    court: "",
                    district: "",
                    state: "",
                    policeStation: "",
                    firNumber: "",
                    opposingPartyName: "",
                    opposingPartyAddress: "",
                    lawyerName: "",
                    evidenceDescription: "",
                    witnessDetails: "",
                    urgencyLevel: "Normal"
                });
                setFiles([]);
            }, 3000);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <div className="case-submission-wrapper">
                <div className="dashboard-header">
                    <h1>📌 Case Submission Form</h1>
                    <p>Submit your case with complete details and get AI-powered legal analysis</p>
                </div>

                {error && (
                    <div className="error-message-box">
                        <span className="error-icon">⚠️</span>
                        <div className="error-content">
                            <strong>Error:</strong>
                            <pre style={{whiteSpace: 'pre-wrap', margin: '5px 0 0 0', fontFamily: 'inherit'}}>
                                {error}
                            </pre>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="success-message-box">
                        <span className="success-icon">✅</span>
                        <span>Case submitted successfully!</span>
                    </div>
                )}
                
                <div className="case-form-container">
                    <form onSubmit={handleSubmit} className="case-submission-form">
                        
                        {/* Personal Information Section */}
                        <div className="form-section">
                            <h3 className="section-title">👤 Personal Information</h3>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        <span className="label-icon">👤</span>
                                        Full Name *
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
                                        Email Address *
                                    </label>
                                    <input 
                                        type="email" 
                                        name="email" 
                                        value={formData.email} 
                                        onChange={handleChange} 
                                        required 
                                        className="form-input"
                                        placeholder="your.email@example.com"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        <span className="label-icon">📱</span>
                                        Phone Number *
                                    </label>
                                    <input 
                                        type="tel" 
                                        name="phoneNumber" 
                                        value={formData.phoneNumber} 
                                        onChange={handleChange} 
                                        required 
                                        className="form-input"
                                        placeholder="+91 9876543210"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <span className="label-icon">🏠</span>
                                        Address *
                                    </label>
                                    <input 
                                        type="text" 
                                        name="address" 
                                        value={formData.address} 
                                        onChange={handleChange} 
                                        required 
                                        className="form-input"
                                        placeholder="Your complete address"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Case Information Section */}
                        <div className="form-section">
                            <h3 className="section-title">📋 Case Information</h3>
                            
                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">📝</span>
                                    Case Title *
                                </label>
                                <input 
                                    type="text" 
                                    name="caseTitle" 
                                    value={formData.caseTitle} 
                                    onChange={handleChange} 
                                    required 
                                    className="form-input"
                                    placeholder="Brief title of your case"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        <span className="label-icon">📋</span>
                                        Case Type *
                                    </label>
                                    <select
                                        name="caseType"
                                        value={formData.caseType}
                                        onChange={handleChange}
                                        className="form-select"
                                    >
                                        <option value="Civil">Civil</option>
                                        <option value="Criminal">Criminal</option>
                                        <option value="Corporate">Corporate</option>
                                        <option value="Family">Family</option>
                                        <option value="Labor">Labor</option>
                                        <option value="Property">Property</option>
                                        <option value="Constitutional">Constitutional</option>
                                        <option value="Tax">Tax</option>
                                        <option value="Consumer">Consumer Protection</option>
                                        <option value="Environmental">Environmental</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <span className="label-icon">📅</span>
                                        Incident/Case Date *
                                    </label>
                                    <input 
                                        type="date" 
                                        name="caseDate" 
                                        value={formData.caseDate} 
                                        onChange={handleChange} 
                                        required 
                                        className="form-input"
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">📄</span>
                                    Case Description *
                                </label>
                                <textarea 
                                    name="caseDescription" 
                                    value={formData.caseDescription} 
                                    onChange={handleChange} 
                                    required 
                                    className="form-textarea"
                                    rows="6"
                                    placeholder="Describe your case in detail. Include all relevant facts, circumstances, and what happened..."
                                />
                                <div className="character-count">
                                    {formData.caseDescription.length} characters
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">⚡</span>
                                    Urgency Level *
                                </label>
                                <select
                                    name="urgencyLevel"
                                    value={formData.urgencyLevel}
                                    onChange={handleChange}
                                    className="form-select"
                                >
                                    <option value="Low">Low - Regular Processing</option>
                                    <option value="Normal">Normal - Standard Timeline</option>
                                    <option value="High">High - Priority Processing</option>
                                    <option value="Critical">Critical - Urgent Attention Required</option>
                                </select>
                            </div>
                        </div>

                        {/* Court & Location Details Section */}
                        <div className="form-section">
                            <h3 className="section-title">🏛️ Court & Location Details</h3>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        <span className="label-icon">🏛️</span>
                                        Court Name *
                                    </label>
                                    <input 
                                        type="text" 
                                        name="court" 
                                        value={formData.court} 
                                        onChange={handleChange} 
                                        required 
                                        className="form-input"
                                        placeholder="e.g., Madurai District Court"
                                        list="court-list"
                                    />
                                    <datalist id="court-list">
                                        {COURT_OPTIONS.map((c) => (
                                            <option key={c} value={c} />
                                        ))}
                                    </datalist>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <span className="label-icon">📍</span>
                                        District *
                                    </label>
                                    <input 
                                        type="text" 
                                        name="district" 
                                        value={formData.district} 
                                        onChange={handleChange} 
                                        required 
                                        className="form-input"
                                        placeholder="District name"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        <span className="label-icon">🗺️</span>
                                        State *
                                    </label>
                                    <input 
                                        type="text" 
                                        name="state" 
                                        value={formData.state} 
                                        onChange={handleChange} 
                                        required 
                                        className="form-input"
                                        placeholder="State name"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <span className="label-icon">🚔</span>
                                        Police Station (if applicable)
                                    </label>
                                    <input 
                                        type="text" 
                                        name="policeStation" 
                                        value={formData.policeStation} 
                                        onChange={handleChange} 
                                        className="form-input"
                                        placeholder="Police station name"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">📋</span>
                                    FIR Number (if applicable)
                                </label>
                                <input 
                                    type="text" 
                                    name="firNumber" 
                                    value={formData.firNumber} 
                                    onChange={handleChange} 
                                    className="form-input"
                                    placeholder="FIR number if case involves criminal complaint"
                                />
                            </div>
                        </div>

                        {/* Opposing Party Details Section */}
                        <div className="form-section">
                            <h3 className="section-title">⚖️ Opposing Party Details</h3>
                            
                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">👥</span>
                                    Opposing Party Name
                                </label>
                                <input 
                                    type="text" 
                                    name="opposingPartyName" 
                                    value={formData.opposingPartyName} 
                                    onChange={handleChange} 
                                    className="form-input"
                                    placeholder="Name of the opposing party"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">🏠</span>
                                    Opposing Party Address
                                </label>
                                <input 
                                    type="text" 
                                    name="opposingPartyAddress" 
                                    value={formData.opposingPartyAddress} 
                                    onChange={handleChange} 
                                    className="form-input"
                                    placeholder="Address of the opposing party (if known)"
                                />
                            </div>
                        </div>

                        {/* Legal Representative Section */}
                        <div className="form-section">
                            <h3 className="section-title">👨‍⚖️ Legal Representative</h3>
                            
                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">👨‍⚖️</span>
                                    Your Lawyer's Name (if any)
                                </label>
                                <input 
                                    type="text" 
                                    name="lawyerName" 
                                    value={formData.lawyerName} 
                                    onChange={handleChange} 
                                    className="form-input"
                                    placeholder="Name of your legal representative"
                                />
                            </div>
                        </div>

                        {/* Evidence & Witnesses Section */}
                        <div className="form-section">
                            <h3 className="section-title">📎 Evidence & Witnesses</h3>
                            
                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">📎</span>
                                    Evidence Description
                                </label>
                                <textarea 
                                    name="evidenceDescription" 
                                    value={formData.evidenceDescription} 
                                    onChange={handleChange} 
                                    className="form-textarea"
                                    rows="4"
                                    placeholder="Describe any evidence you have (documents, photos, videos, recordings, etc.)"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">👥</span>
                                    Witness Details
                                </label>
                                <textarea 
                                    name="witnessDetails" 
                                    value={formData.witnessDetails} 
                                    onChange={handleChange} 
                                    className="form-textarea"
                                    rows="4"
                                    placeholder="List names and contact details of witnesses (if any)"
                                />
                            </div>
                        </div>

                        {/* File Upload Section */}
                        <div className="form-section">
                            <h3 className="section-title">📁 Upload Documents</h3>
                            
                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">📁</span>
                                    Upload Supporting Documents
                                </label>
                                <div className="file-upload-container">
                                    <input 
                                        type="file" 
                                        multiple
                                        onChange={handleFileChange}
                                        className="file-input"
                                        id="fileUpload"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                                    />
                                    <label htmlFor="fileUpload" className="file-upload-label">
                                        <span className="upload-icon">📤</span>
                                        <span>Click to upload or drag and drop</span>
                                        <span className="upload-hint">PDF, DOC, DOCX, JPG, PNG, TXT (Max 10MB each)</span>
                                    </label>
                                </div>
                                
                                {files.length > 0 && (
                                    <div className="uploaded-files">
                                        <h4>Uploaded Files ({files.length}):</h4>
                                        {files.map((file, index) => (
                                            <div key={index} className="file-item">
                                                <span className="file-icon">📄</span>
                                                <span className="file-name">{file.name}</span>
                                                <span className="file-size">
                                                    ({(file.size / 1024).toFixed(2)} KB)
                                                </span>
                                                <button 
                                                    type="button"
                                                    className="remove-file-btn"
                                                    onClick={() => removeFile(index)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Form Actions */}
                        <div className="form-actions">
                            <button 
                                type="button" 
                                className="btn-secondary"
                                onClick={() => navigate("/dashboard")}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="btn-primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-small"></span>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <span>🚀</span>
                                        Submit Case
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
                
                {response.classification && (
                    <div className="ai-response-section">
                        <h2 className="response-title">🤖 AI Analysis Results</h2>
                        
                        <div className="response-grid">
                            <div className="response-card response-classification">
                                <div className="response-card-header">
                                    <h3>📌 Case Classification</h3>
                                </div>
                                <div className="response-card-body">
                                    <p>{response.classification}</p>
                                </div>
                            </div>

                            <div className="response-card response-suggestions">
                                <div className="response-card-header">
                                    <h3>💡 AI Suggestions</h3>
                                </div>
                                <div className="response-card-body">
                                    <p>{response.suggestions}</p>
                                </div>
                            </div>

                            <div className="response-card response-summary">
                                <div className="response-card-header">
                                    <h3>📄 Case Summary</h3>
                                </div>
                                <div className="response-card-body">
                                    <p>{response.summary}</p>
                                </div>
                            </div>
                        </div>

                        <div className="response-actions">
                            <button 
                                className="btn-primary"
                                onClick={() => navigate("/my-cases")}
                            >
                                View My Cases
                            </button>
                            <button 
                                className="btn-secondary"
                                onClick={() => {
                                    setResponse({ classification: "", suggestions: "", summary: "" });
                                    setSuccess(false);
                                    window.scrollTo(0, 0);
                                }}
                            >
                                Submit Another Case
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CaseSubmission;