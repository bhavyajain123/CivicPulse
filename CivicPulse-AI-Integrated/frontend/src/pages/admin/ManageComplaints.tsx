import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, ClipboardList } from "lucide-react";
import {
  complaintService,
  type Complaint,
  type ComplaintStatus,
} from "../../services/complaintService";

type Props = {
  notify?: (message: string) => void;
};

export default function ManageComplaints({ notify }: Props) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await complaintService.getAll();
      setComplaints(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load complaints"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadComplaints();
  }, [loadComplaints]);

  const filteredComplaints = useMemo(() => {
    if (filter === "all") return complaints;
    return complaints.filter((item) => item.status === filter);
  }, [complaints, filter]);

  const updateStatus = async (
    complaint: Complaint,
    status: Exclude<ComplaintStatus, "submitted">
  ) => {
    let resolutionRemarks: string | undefined;

    if (status === "resolved" || status === "rejected") {
      const remarks = window.prompt(
        status === "resolved"
          ? "Enter resolution remarks:"
          : "Enter reason for rejection:"
      );

      if (!remarks?.trim()) {
        notify?.("Remarks are required for this action.");
        return;
      }

      resolutionRemarks = remarks.trim();
    }

    setSavingId(complaint._id);

    try {
      await complaintService.update(complaint._id, {
        status,
        ...(resolutionRemarks ? { resolutionRemarks } : {}),
      });

      notify?.("Complaint status updated successfully.");
      await loadComplaints();
    } catch (err) {
      notify?.(
        err instanceof Error ? err.message : "Unable to update complaint"
      );
    } finally {
      setSavingId(null);
    }
  };

  const statusTone = (status: ComplaintStatus) => {
    if (status === "resolved") return "green";
    if (status === "rejected") return "red";
    if (status === "in_progress") return "blue";
    if (status === "under_review") return "orange";
    return "slate";
  };

  const residentName = (complaint: Complaint) => {
    return typeof complaint.userId === "string"
      ? "Resident"
      : complaint.userId.name || complaint.userId.email || "Resident";
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString();

  const actions = (complaint: Complaint) => {
    if (complaint.status === "submitted") {
      return (
        <>
          <button
            className="btn btn-secondary"
            disabled={savingId === complaint._id}
            onClick={() => void updateStatus(complaint, "under_review")}
          >
            Review
          </button>
          <button
            className="btn btn-secondary"
            disabled={savingId === complaint._id}
            onClick={() => void updateStatus(complaint, "rejected")}
          >
            Reject
          </button>
        </>
      );
    }

    if (complaint.status === "under_review") {
      return (
        <>
          <button
            className="btn btn-primary"
            disabled={savingId === complaint._id}
            onClick={() => void updateStatus(complaint, "in_progress")}
          >
            Start work
          </button>
          <button
            className="btn btn-secondary"
            disabled={savingId === complaint._id}
            onClick={() => void updateStatus(complaint, "rejected")}
          >
            Reject
          </button>
        </>
      );
    }

    if (complaint.status === "in_progress") {
      return (
        <>
          <button
            className="btn btn-primary"
            disabled={savingId === complaint._id}
            onClick={() => void updateStatus(complaint, "resolved")}
          >
            Resolve
          </button>
          <button
            className="btn btn-secondary"
            disabled={savingId === complaint._id}
            onClick={() => void updateStatus(complaint, "rejected")}
          >
            Reject
          </button>
        </>
      );
    }

    return <span className="muted-text">No further action</span>;
  };

  return (
    <section className="panel full-panel">
      <div className="panel-head">
        <div>
          <h3>Citizen Complaints</h3>
          <p>Live complaint records from the database</p>
        </div>

        <div className="toolbar-right">
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All complaints</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under review</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            className="btn btn-secondary"
            onClick={() => void loadComplaints()}
            disabled={loading}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total complaints</span>
          <h2>{complaints.length}</h2>
        </div>
        <div className="stat-card">
          <span>Pending review</span>
          <h2>
            {complaints.filter((c) => c.status === "submitted").length}
          </h2>
        </div>
        <div className="stat-card">
          <span>In progress</span>
          <h2>
            {complaints.filter((c) => c.status === "in_progress").length}
          </h2>
        </div>
        <div className="stat-card">
          <span>Resolved</span>
          <h2>
            {complaints.filter((c) => c.status === "resolved").length}
          </h2>
        </div>
      </div>

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

      {loading && (
        <div className="empty-state">
          <b>Loading complaints...</b>
        </div>
      )}

      {!loading && !error && filteredComplaints.length === 0 && (
        <div className="empty-state">
          <ClipboardList size={28} />
          <b>No complaints found</b>
          <span>Submitted citizen complaints will appear here.</span>
        </div>
      )}

      {!loading && !error && filteredComplaints.length > 0 && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>COMPLAINT</th>
                <th>RESIDENT</th>
                <th>CATEGORY</th>
                <th>DATE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredComplaints.map((complaint) => (
                <tr key={complaint._id}>
                  <td>
                    <b>{complaint.title}</b>
                    <small>{complaint.description}</small>
                  </td>

                  <td>{residentName(complaint)}</td>

                  <td>{complaint.category}</td>

                  <td>{formatDate(complaint.createdAt)}</td>

                  <td>
                    <span className={`badge ${statusTone(complaint.status)}`}>
                      {complaint.status.replace("_", " ")}
                    </span>
                  </td>

                  <td>
                    <div className="toolbar-right">
                      {savingId === complaint._id
                        ? "Saving..."
                        : actions(complaint)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}