import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header";
import Home from "./pages/Home";
import Chat from "./components/Chat";
import CaseTracking from "./pages/CaseTracking";
import Register from "./pages/Register";
import Login from "./pages/Login";
import CaseSubmission from "./pages/CaseSubmission";
import MyCases from "./pages/MyCases";
import Profile from "./pages/Profile";
import ClientList from "./pages/ClientList";
import CaseSchedule from "./pages/CaseSchedule";
import DocumentVault from "./pages/DocumentVault";

import ProtectedRoute from "./components/ProtectedRoute";
import LawyerDashboard from "./pages/LawyerDashboard";
import JudgeDashboard from "./pages/JudgeDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <Router>
      <Header />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* LawGPT Chat */}
        <Route 
          path="/lawgpt" 
          element={
            <ProtectedRoute allowedRoles={["lawyer", "judge", "court_staff", "admin"]}>
              <Chat />
            </ProtectedRoute>
          } 
        />

        {/* Case Management Routes - Protected */}
        <Route 
          path="/case-submit" 
          element={
            <ProtectedRoute allowedRoles={["lawyer", "judge", "court_staff", "admin"]}>
              <CaseSubmission />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/submit-case" 
          element={
            <ProtectedRoute allowedRoles={["lawyer", "judge", "court_staff", "admin"]}>
              <CaseSubmission />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/my-cases" 
          element={
            <ProtectedRoute allowedRoles={["lawyer", "judge", "court_staff", "admin"]}>
              <MyCases />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/track-case" 
          element={
            <ProtectedRoute allowedRoles={["lawyer", "judge", "court_staff", "admin"]}>
              <CaseTracking />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/case-tracking" 
          element={
            <ProtectedRoute allowedRoles={["lawyer", "judge", "court_staff", "admin"]}>
              <CaseTracking />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/clients" 
          element={
            <ProtectedRoute allowedRoles={["lawyer", "judge", "court_staff", "admin"]}>
              <ClientList />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/case-schedule" 
          element={
            <ProtectedRoute allowedRoles={["lawyer", "judge", "court_staff", "admin"]}>
              <CaseSchedule />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/document-vault" 
          element={
            <ProtectedRoute allowedRoles={["lawyer", "judge", "court_staff", "admin"]}>
              <DocumentVault />
            </ProtectedRoute>
          } 
        />

        {/* Profile Route */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute allowedRoles={["lawyer", "judge", "court_staff", "admin"]}>
              <Profile />
            </ProtectedRoute>
          } 
        />

        {/* Role-Based Dashboard Routes */}
        <Route 
          path="/lawyer-dashboard" 
          element={
            <ProtectedRoute allowedRoles={["lawyer"]}>
              <LawyerDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={["lawyer"]}>
              <LawyerDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/judge-dashboard" 
          element={
            <ProtectedRoute allowedRoles={["judge"]}>
              <JudgeDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/staff-dashboard" 
          element={
            <ProtectedRoute allowedRoles={["court_staff"]}>
              <StaffDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* 404 Not Found */}
        <Route
          path="*"
          element={
            <div style={{ 
              padding: "3rem", 
              textAlign: "center",
              minHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center"
            }}>
              <h1 style={{ fontSize: "4rem", marginBottom: "1rem" }}>404</h1>
              <h2 style={{ marginBottom: "1rem" }}>Page Not Found</h2>
              <p style={{ color: "#64748b", marginBottom: "2rem" }}>
                The page you're looking for doesn't exist.
              </p>
              <button 
                onClick={() => window.location.href = "/"}
                style={{
                  background: "#2563eb",
                  color: "white",
                  padding: "0.75rem 1.5rem",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: "500"
                }}
              >
                Go Home
              </button>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;