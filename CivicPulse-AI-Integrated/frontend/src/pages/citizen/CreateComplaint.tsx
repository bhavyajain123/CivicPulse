import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { complaintService } from "../../services/complaintService";

export default function CreateComplaint() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<
    "water" | "electricity" | "road" | "sanitation" |
    "drainage" | "streetlight" | "other"
  >("water");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (title.trim().length < 5) {
      setError("Title must contain at least 5 characters.");
      return;
    }

    if (description.trim().length < 10) {
      setError("Description must contain at least 10 characters.");
      return;
    }

    setLoading(true);

    try {
      await complaintService.create({
        title: title.trim(),
        description: description.trim(),
        category,
      });

      navigate("/citizen/complaints", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit complaint. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="content-wrap">
      <section className="panel full-panel">
        <div className="panel-head">
          <div>
            <div className="eyebrow">CIVICCONNECT CITIZEN PORTAL</div>
            <h3>File a Complaint</h3>
            <p>Report a civic issue to your municipal response team.</p>
          </div>

          <Link
            to="/citizen/complaints"
            className="btn btn-secondary"
          >
            <ArrowLeft size={15} /> My Complaints
          </Link>
        </div>

        <form
          className="form-grid"
          onSubmit={handleSubmit}
          style={{ marginTop: "22px" }}
        >
          <label className="full">
            Complaint title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Water supply problem in Sector 5"
              minLength={5}
              maxLength={150}
              required
            />
          </label>

          <label className="full">
            Category
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as typeof category)
              }
            >
              <option value="water">Water</option>
              <option value="electricity">Electricity</option>
              <option value="road">Road</option>
              <option value="sanitation">Sanitation</option>
              <option value="drainage">Drainage</option>
              <option value="streetlight">Streetlight</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="full">
            Describe the issue
            <textarea
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Explain the issue, affected area and relevant details..."
              minLength={10}
              maxLength={3000}
              required
            />
          </label>

          {error && (
            <p
              className="full"
              role="alert"
              style={{ color: "#f28c8c", fontSize: "12px" }}
            >
              {error}
            </p>
          )}

          <div className="modal-actions full">
            <Link
              to="/citizen/complaints"
              className="btn btn-secondary"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <Send size={15} />
              {loading ? "Submitting..." : "Submit complaint"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}