import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import "../styles/auth.css"

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      // Save token and user info
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("userName", data.user.fullName);
      if (data.user.assignedCourt) localStorage.setItem("assignedCourt", data.user.assignedCourt);
      else localStorage.removeItem("assignedCourt");
      window.dispatchEvent(new CustomEvent("auth-state-changed"));

      setMessage("✅ Login successful! Redirecting...");

      // Role-based redirection
      setTimeout(() => {
        const role = data.user.role;
        if (role === "lawyer") navigate("/lawyer-dashboard");
        else if (role === "judge") navigate("/judge-dashboard");
        else if (role === "court_staff") navigate("/staff-dashboard");
        else if (role === "admin") navigate("/admin-dashboard");
        else navigate("/");
      }, 1000);

    } catch (error) {
      setMessage("❌ " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🔐 Login</h2>
        <p className="auth-subtitle">Access your Digital Judiciary account</p>

        <form onSubmit={handleLogin}>
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
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && (
          <p className={message.includes("✅") ? "success-message" : "error-message"}>
            {message}
          </p>
        )}

        <div className="auth-links">
          <p>Don't have an account? <a href="/register">Register here</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;