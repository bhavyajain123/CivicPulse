import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Star, MessageSquare } from "lucide-react";
import {
  feedbackService,
  type Feedback,
} from "../../services/feedbackService";

type Props = {
  notify?: (message: string) => void;
};

export default function ManageFeedback({ notify }: Props) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await feedbackService.getAll();
      setFeedback(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load feedback"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  const handleReview = async (item: Feedback) => {
    setSavingId(item._id);

    try {
      const result = await feedbackService.updateStatus(
        item._id,
        "reviewed"
      );

      notify?.(result.message || "Feedback marked as reviewed.");
      await loadFeedback();
    } catch (err) {
      notify?.(
        err instanceof Error ? err.message : "Unable to review feedback"
      );
    } finally {
      setSavingId(null);
    }
  };

  const citizenName = (item: Feedback) =>
    typeof item.userId === "string"
      ? "Citizen"
      : item.userId.name || item.userId.email || "Citizen";

  const incidentTitle = (item: Feedback) =>
    typeof item.incidentId === "string"
      ? "Incident"
      : item.incidentId.title;

  return (
    <section className="panel full-panel">
      <div className="panel-head">
        <div>
          <h3>Citizen Feedback</h3>
          <p>Review ratings and comments submitted by citizens.</p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => void loadFeedback()}
          disabled={loading}
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total feedback</span>
          <h2>{feedback.length}</h2>
        </div>

        <div className="stat-card">
          <span>Pending review</span>
          <h2>{feedback.filter(f => f.status === "pending").length}</h2>
        </div>

        <div className="stat-card">
          <span>Reviewed</span>
          <h2>{feedback.filter(f => f.status === "reviewed").length}</h2>
        </div>
      </div>

      {error && (
        <div className="empty-state">
          <b>Unable to load feedback</b>
          <span>{error}</span>
          <button
            className="btn btn-secondary"
            onClick={() => void loadFeedback()}
          >
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="empty-state">
          <b>Loading feedback...</b>
        </div>
      )}

      {!loading && !error && feedback.length === 0 && (
        <div className="empty-state">
          <MessageSquare size={28} />
          <b>No citizen feedback found</b>
          <span>Submitted ratings and comments will appear here.</span>
        </div>
      )}

      {!loading && !error && feedback.length > 0 && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>CITIZEN</th>
                <th>INCIDENT</th>
                <th>RATING</th>
                <th>COMMENT</th>
                <th>DATE</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {feedback.map(item => (
                <tr key={item._id}>
                  <td>{citizenName(item)}</td>

                  <td>
                    <b>{incidentTitle(item)}</b>
                  </td>

                  <td>
                    <span style={{ color: "#eab95d" }}>
                      {Array.from({ length: item.rating }, (_, i) => (
                        <Star
                          key={i}
                          size={13}
                          fill="currentColor"
                          style={{ display: "inline" }}
                        />
                      ))}
                    </span>
                    <small>{item.rating}/5</small>
                  </td>

                  <td>{item.comment}</td>

                  <td>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>

                  <td>
                    <span
                      className={`badge ${
                        item.status === "reviewed" ? "green" : "orange"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td>
                    {item.status === "pending" ? (
                      <button
                        className="btn btn-primary"
                        disabled={savingId === item._id}
                        onClick={() => void handleReview(item)}
                      >
                        {savingId === item._id
                          ? "Saving..."
                          : "Mark reviewed"}
                      </button>
                    ) : (
                      <span>No action needed</span>
                    )}
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