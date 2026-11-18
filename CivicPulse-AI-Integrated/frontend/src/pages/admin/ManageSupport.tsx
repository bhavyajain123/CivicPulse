import { useCallback, useEffect, useState } from "react";

import {
  RefreshCw,
  Headphones,
  Search,
  Eye,
  CheckCircle2,
  Clock3
} from "lucide-react";

import {
  supportService,
  type SupportRequest,
  type SupportStatus
} from "../../services/supportService";

export default function ManageSupport() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [selectedRequest, setSelectedRequest] =
    useState<SupportRequest | null>(null);

  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await supportService.getAll();
      setRequests(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load support requests"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const openDetails = async (id: string) => {
    setDetailsLoading(true);
    setError("");

    try {
      const data = await supportService.getById(id);
      setSelectedRequest(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load support request details"
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const changeStatus = async (
    id: string,
    status: SupportStatus
  ) => {
    setBusyId(id);
    setError("");

    try {
      const updated = await supportService.updateStatus(id, status);

      setRequests(previous =>
        previous.map(item =>
          item._id === id ? updated : item
        )
      );

      setSelectedRequest(current =>
        current?._id === id ? updated : current
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update support request"
      );

      void loadRequests();
    } finally {
      setBusyId(null);
    }
  };

  const filteredRequests = requests.filter(request => {
    const value = search.toLowerCase();

    return (
      request.email.toLowerCase().includes(value) ||
      request.category.toLowerCase().includes(value) ||
      request.message.toLowerCase().includes(value)
    );
  });

  const openCount = requests.filter(
    item => item.status === "open"
  ).length;

  const progressCount = requests.filter(
    item => item.status === "in_progress"
  ).length;

  const resolvedCount = requests.filter(
    item => item.status === "resolved"
  ).length;

  const statusLabel = (status: SupportStatus) => {
    if (status === "in_progress") return "In Progress";

    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const statusTone = (status: SupportStatus) => {
    if (status === "resolved") return "green";
    if (status === "in_progress") return "blue";

    return "orange";
  };

  return (
    <section className="panel full-panel">

      <div className="panel-head">
        <div>
          <div className="eyebrow">CIVICCONNECT ADMINISTRATION</div>
          <h3>Support Requests</h3>
          <p>Review and manage citizen support requests.</p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => void loadRequests()}
          disabled={loading}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {}
      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-top">
            <span>Open Requests</span>
            <Clock3 size={18} />
          </div>
          <div className="stat-value">{openCount}</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>In Progress</span>
            <Headphones size={18} />
          </div>
          <div className="stat-value">{progressCount}</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Resolved</span>
            <CheckCircle2 size={18} />
          </div>
          <div className="stat-value">{resolvedCount}</div>
        </div>

      </div>

      {}
      <div className="toolbar" style={{ marginTop: "20px" }}>
        <div className="search-field">
          <Search size={16} />

          <input
            placeholder="Search email, category or message..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="empty-state" role="alert">
          {error}
        </div>
      )}

      {loading && (
        <div className="empty-state">
          Loading support requests...
        </div>
      )}

      {!loading && !error && filteredRequests.length === 0 && (
        <div className="empty-state">
          <Headphones size={25} />
          <b>No support requests found</b>
          <span>Submitted requests will appear here.</span>
        </div>
      )}

      {}
      {!loading && !error && filteredRequests.length > 0 && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>EMAIL</th>
                <th>CATEGORY</th>
                <th>DATE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredRequests.map(request => (
                <tr key={request._id}>

                  <td>
                    <b>{request.email}</b>
                  </td>

                  <td>{request.category}</td>

                  <td>
                    {new Date(request.createdAt).toLocaleString()}
                  </td>

                  <td>
                    <span className={`badge ${statusTone(request.status)}`}>
                      {statusLabel(request.status)}
                    </span>
                  </td>

                  <td>
                    <div style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap"
                    }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => void openDetails(request._id)}
                      >
                        <Eye size={14} />
                        View
                      </button>

                      <select
                        value={request.status}
                        disabled={busyId === request._id}
                        aria-label={`Status for ${request.email}`}
                        onChange={e =>
                          void changeStatus(
                            request._id,
                            e.target.value as SupportStatus
                          )
                        }
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {}
      {selectedRequest && (
        <div
          className="panel"
          style={{ marginTop: "22px", padding: "20px" }}
        >
          <div className="panel-head">
            <div>
              <h3>Support Request Details</h3>
              <p>{selectedRequest.email}</p>
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => setSelectedRequest(null)}
            >
              Close
            </button>
          </div>

          {detailsLoading ? (
            <p>Loading request details...</p>
          ) : (
            <>
              <p>
                <b>Category:</b> {selectedRequest.category}
              </p>

              <p>
                <b>Message:</b>
              </p>

              <p style={{ whiteSpace: "pre-wrap" }}>
                {selectedRequest.message}
              </p>

              <p>
                <b>Status:</b>{" "}
                {statusLabel(selectedRequest.status)}
              </p>

              <p>
                <b>Submitted:</b>{" "}
                {new Date(selectedRequest.createdAt).toLocaleString()}
              </p>
            </>
          )}
        </div>
      )}

    </section>
  );
}