import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, Star, MessageSquare } from "lucide-react";
import { incidentService, type Incident } from "../../services/incidentService";
import {
  feedbackService,
  type Feedback,
} from "../../services/feedbackService";

export default function CitizenFeedback() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [incidentId, setIncidentId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [incidentData, feedbackData] = await Promise.all([
        incidentService.getMine(),
        feedbackService.getMine(),
      ]);

      setIncidents(incidentData);
      setFeedback(feedbackData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load feedback data"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const submittedIncidentIds = useMemo(
    () =>
      new Set(
        feedback.map((item) =>
          typeof item.incidentId === "string"
            ? item.incidentId
            : item.incidentId._id
        )
      ),
    [feedback]
  );

  const eligibleIncidents = useMemo(
    () =>
      incidents.filter(
        (item) =>
          item.status === "resolved" &&
          !submittedIncidentIds.has(item._id)
      ),
    [incidents, submittedIncidentIds]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!incidentId) {
      setError("Please select a resolved incident.");
      return;
    }

    if (comment.trim().length < 5) {
      setError("Comment must contain at least 5 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await feedbackService.create({
        incidentId,
        rating,
        comment: comment.trim(),
      });

      setNotice(result.message || "Feedback submitted successfully.");
      setIncidentId("");
      setRating(5);
      setComment("");

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit feedback"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const incidentTitle = (item: Feedback) =>
    typeof item.incidentId === "string"
      ? "Incident"
      : item.incidentId.title;

  return (
    <main className="content-wrap">
      <section className="panel full-panel">
        <div className="panel-head">
          <div>
            <div className="eyebrow">CIVICCONNECT CITIZEN PORTAL</div>
            <h3>Feedback & Ratings</h3>
            <p>Share your experience after an incident is resolved.</p>
          </div>

          <div className="toolbar-right">
            <button
              className="btn btn-secondary"
              onClick={() => void loadData()}
              disabled={loading}
            >
              <RefreshCw size={15} /> Refresh
            </button>

            <Link
              to="/citizen/complaints"
              className="btn btn-secondary"
            >
              My Complaints
            </Link>
          </div>
        </div>

        {notice && (
          <p role="status" style={{ color: "#43b7a1", marginTop: "16px" }}>
            {notice}
          </p>
        )}

        {error && (
          <p role="alert" style={{ color: "#f28c8c", marginTop: "16px" }}>
            {error}
          </p>
        )}

        {loading ? (
          <div className="empty-state">
            <b>Loading your resolved incidents...</b>
          </div>
        ) : (
          <div className="overview-grid" style={{ marginTop: "20px" }}>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h3>Rate your experience</h3>
                  <p>One feedback submission per resolved incident.</p>
                </div>
                <Star size={20} />
              </div>

              {eligibleIncidents.length === 0 ? (
                <div className="empty-state">
                  <MessageSquare size={28} />
                  <b>No incidents available for feedback</b>
                  <span>
                    Only your resolved incidents that have not already
                    received feedback will appear here.
                  </span>
                </div>
              ) : (
                <form className="form-grid" onSubmit={handleSubmit}>
                  <label className="full">
                    Select resolved incident
                    <select
                      value={incidentId}
                      onChange={(event) => setIncidentId(event.target.value)}
                      required
                    >
                      <option value="">Choose an incident</option>
                      {eligibleIncidents.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.title}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="full">
                    <b>Your rating</b>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: "12px",
                        alignItems: "center",
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          aria-label={`Rate ${value} out of 5`}
                          aria-pressed={rating === value}
                          onClick={() => setRating(value)}
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            color: value <= rating ? "#eab95d" : "#64748b",
                            padding: "2px",
                          }}
                        >
                          <Star
                            size={28}
                            fill={value <= rating ? "currentColor" : "none"}
                          />
                        </button>
                      ))}
                      <span>{rating}/5</span>
                    </div>
                  </div>

                  <label className="full">
                    Your comments
                    <textarea
                      rows={5}
                      minLength={5}
                      maxLength={1000}
                      required
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder="Tell us about your experience with the response..."
                    />
                  </label>

                  <div className="modal-actions full">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                    >
                      <Star size={15} />
                      {submitting ? "Submitting..." : "Submit feedback"}
                    </button>
                  </div>
                </form>
              )}
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <h3>My feedback history</h3>
                  <p>Your previously submitted ratings.</p>
                </div>
              </div>

              {feedback.length === 0 ? (
                <div className="empty-state">
                  <MessageSquare size={25} />
                  <b>No feedback submitted yet</b>
                  <span>Your submitted feedback will appear here.</span>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "14px" }}>
                  {feedback.map((item) => (
                    <div
                      key={item._id}
                      className="panel"
                      style={{ padding: "14px" }}
                    >
                      <b>{incidentTitle(item)}</b>

                      <div style={{ color: "#eab95d", margin: "8px 0" }}>
                        {"★".repeat(item.rating)}
                        {"☆".repeat(5 - item.rating)}
                      </div>

                      <p>{item.comment}</p>

                      <div className="toolbar-right">
                        <span className={`badge ${item.status === "reviewed" ? "green" : "orange"}`}>
                          {item.status}
                        </span>
                        <small>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}