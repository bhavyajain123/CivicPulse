
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Home from "../pages/public/Home";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import AdminDashboard from "../pages/admin/AdminDashboard";
import ProtectedRoute from "./ProtectedRoute";
import OfficerDashboard from "../pages/officer/OfficerDashboard";
import CreateComplaint from "../pages/citizen/CreateComplaint";
import MyComplaints from "../pages/citizen/MyComplaints";
import CitizenFeedback from "../pages/citizen/CitizenFeedback";
import ReportIncident from "../pages/citizen/ReportIncident";
import LiveTracking from "../pages/citizen/LiveTracking";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

        <Route
          element={
            <ProtectedRoute allowedRoles={["admin", "operator"]} />
          }
        >
          <Route
            path="/dashboard/*"
            element={<AdminDashboard />}
          />
        </Route>
        <Route
  element={
    <ProtectedRoute allowedRoles={["response_team"]} />
  }
>
  <Route
    path="/officer"
    element={<OfficerDashboard />}
  />
</Route>

<Route
  element={
    <ProtectedRoute allowedRoles={["citizen"]} />
  }
>
  <Route
    path="/citizen/complaints"
    element={<MyComplaints />}
  />
  <Route
  path="/citizen/live-tracking"
  element={<LiveTracking />}
/>
  <Route
    path="/citizen/complaints/new"
    element={<CreateComplaint />}
  />
</Route>
<Route
  path="/citizen/feedback"
  element={<CitizenFeedback />}
/>
<Route
  path="/citizen/report-incident"
  element={<ReportIncident />}
/>

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
        
      </Routes>
    </BrowserRouter>
  );
}
