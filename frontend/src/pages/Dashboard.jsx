import { Routes, Route } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";
import CaseSubmission from "./CaseSubmission";
import CaseSchedule from "./CaseSchedule";
import CaseSummary from "./CaseSummary";

export default function Dashboard() {
  return (
    <>
      <DashboardHeader />

      <div style={styles.container}>
        <Routes>
          <Route path="/" element={<CaseSubmission />} />
          <Route path="submit" element={<CaseSubmission />} />
          <Route path="schedule" element={<CaseSchedule />} />
          <Route path="summary" element={<CaseSummary />} />
        </Routes>
      </div>
    </>
  );
}

const styles = {
  container: {
    padding: 30,
    background: "#f4f6f8",
    minHeight: "100vh",
  },
};
