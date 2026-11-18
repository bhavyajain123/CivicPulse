import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  RefreshCw,
  Plus,
  ClipboardList,
  MessageSquare,
  AlertTriangle,
  MapPin
} from "lucide-react";
import {
  complaintService,
  type Complaint,
} from "../../services/complaintService";

export default function MyComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await complaintService.getMine();
      setComplaints(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your complaints"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadComplaints();
  }, [loadComplaints]);

  const statusLabel = (status: string) =>
    status.replace("_", " ");

  const statusTone = (status: string) => {
    if (status === "resolved") return "green";
    if (status === "rejected") return "red";
    if (status === "in_progress") return "blue";
    if (status === "under_review") return "orange";
    return "slate";
  };

  return (
    <main className="content-wrap">
      <section className="panel full-panel">
        <div className="panel-head">
          <div>
            <div className="eyebrow">CIVICCONNECT CITIZEN PORTAL</div>
            <h3>My Complaints</h3>
            <p>View and track your submitted complaints.</p>
          </div>

<div className="toolbar-right">

  <button
    className="btn btn-secondary"
    onClick={() => void loadComplaints()}
    disabled={loading}
  >
    <RefreshCw size={15} />
    Refresh
  </button>

  <Link
    to="/citizen/complaints/new"
    className="btn btn-primary"
  >
    <Plus size={16} />
    File a complaint
  </Link>

  <Link
    to="/citizen/report-incident"
    className="btn btn-secondary"
  >
    <AlertTriangle size={16} />
    Report Incident
  </Link>

  <Link
    to="/citizen/feedback"
    className="btn btn-secondary"
  >
    <MessageSquare size={16} />
    Give Feedback
  </Link>

  <Link
    to="/citizen/live-tracking"
    className="btn btn-primary"
  >
    <MapPin size={16} />
    Track Incidents
  </Link>

</div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span>Total complaints</span>
            <h2>{complaints.length}</h2>
          </div>

          <div className="stat-card">
            <span>Under review</span>
            <h2>
              {complaints.filter(
                (c) => c.status === "under_review"
              ).length}
            </h2>
          </div>

          <div className="stat-card">
            <span>In progress</span>
            <h2>
              {complaints.filter(
                (c) => c.status === "in_progress"
              ).length}
            </h2>
          </div>

          <div className="stat-card">
            <span>Resolved</span>
            <h2>
              {complaints.filter(
                (c) => c.status === "resolved"
              ).length}
            </h2>
          </div>
        </div>

        {loading && (
          <div className="empty-state">
            <b>Loading your complaints...</b>
          </div>
        )}

        {error && (
          <div className="empty-state">
            <b>Unable to load complaints</b>
            <span>{error}</span>
            <button
              className="btn btn-secondary"
              onClick={() => void loadComplaints()}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && complaints.length === 0 && (
          <div className="empty-state">
            <ClipboardList size={30} />
            <b>No complaints submitted yet</b>
            <span>Your submitted complaints will appear here.</span>
            <Link
              to="/citizen/complaints/new"
              className="btn btn-primary"
            >
              <Plus size={15} /> File your first complaint
            </Link>
          </div>
        )}

        {!loading && !error && complaints.length > 0 && (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>COMPLAINT</th>
                  <th>CATEGORY</th>
                  <th>SUBMITTED</th>
                  <th>STATUS</th>
                </tr>
              </thead>

              <tbody>
                {complaints.map((complaint) => (
                  <tr key={complaint._id}>
                    <td>
                      <b>{complaint.title}</b>
                      <small>{complaint.description}</small>

                      {complaint.resolutionRemarks && (
                        <small>
                          Remarks: {complaint.resolutionRemarks}
                        </small>
                      )}
                    </td>

                    <td>{complaint.category}</td>

                    <td>
                      {new Date(
                        complaint.createdAt
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      <span
                        className={`badge ${statusTone(complaint.status)}`}
                      >
                        {statusLabel(complaint.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}