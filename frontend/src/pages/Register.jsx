import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import "../styles/auth.css";

const ASSIGNED_COURTS = [
  "Madurai District Court",
  "Sivagangai Old Court",
  "Chennai High Court",
  "Coimbatore District Court",
  "Trichy District Court",
  "Salem District Court",
  "District Court",
  "High Court"
];

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "lawyer",
    assignedCourt: ""
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.role === "court_staff" && !formData.assignedCourt?.trim()) {
      setMessage("❌ Court staff must select their assigned court/location.");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      const payload = { ...formData };
      if (formData.role !== "court_staff") delete payload.assignedCourt;
      const response = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      // Save token and user info
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("userName", data.user.fullName);
      if (data.user.assignedCourt) localStorage.setItem("assignedCourt", data.user.assignedCourt);
      window.dispatchEvent(new CustomEvent("auth-state-changed"));

      setMessage("✅ Registration successful! Redirecting...");

      setTimeout(() => {
        const role = data.user.role;
        if (role === "lawyer") navigate("/lawyer-dashboard");
        else if (role === "judge") navigate("/judge-dashboard");
        else if (role === "court_staff") navigate("/staff-dashboard");
        else if (role === "admin") navigate("/admin-dashboard");
        else navigate("/");
      }, 1500);

    } catch (error) {
      setMessage("❌ " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🔐 Create Account</h2>
        <p className="auth-subtitle">Join the Digital Judiciary System</p>

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <select 
              name="role" 
              value={formData.role}
              onChange={handleChange}
              className="form-input"
            >
              <option value="lawyer">Lawyer</option>
              <option value="judge">Judge</option>
              <option value="court_staff">Court Staff</option>
            </select>
          </div>

          {formData.role === "court_staff" && (
            <div className="form-group">
              <label>Assigned Court / Location *</label>
              <select
                name="assignedCourt"
                value={formData.assignedCourt}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="">Select your court</option>
                {ASSIGNED_COURTS.map((court) => (
                  <option key={court} value={court}>{court}</option>
                ))}
              </select>
              <p className="auth-field-hint">You will only see and manage cases for this court. Choose the court you are authorized for.</p>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        {message && (
          <p className={message.includes("✅") ? "success-message" : "error-message"}>
            {message}
          </p>
        )}

        <div className="auth-links">
          <p>Already have an account? <a href="/login">Login here</a></p>
        </div>
      </div>
    </div>
  );
};

export default Register;