import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { MapPin, Send, RefreshCw, Sparkles } from "lucide-react";
import { incidentService } from "../../services/incidentService";
import { mapService } from "../../services/mapService";
import {
  aiService,
  mlAiService,
  type MLComplaintPrediction,
  type IncidentAnalysis,
  type DuplicateCheckResult,
  type TeamRecommendationResult
} from "../../services/aiService";

type Category = "fire" | "accident" | "medical" | "crime" | "other";

export default function ReportIncident() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("other");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [mlAnalyzing, setMlAnalyzing] = useState(false);
  const [mlPrediction, setMlPrediction] = useState<MLComplaintPrediction | null>(null);
  const [mlError, setMlError] = useState("");

const [analysis, setAnalysis] =
  useState<IncidentAnalysis | null>(null);

const [analysisError, setAnalysisError] = useState("");
const [checkingDuplicates, setCheckingDuplicates] = useState(false);

const [duplicateResult, setDuplicateResult] =
  useState<DuplicateCheckResult | null>(null);
  const [recommendingTeams, setRecommendingTeams] = useState(false);

const [teamRecommendation, setTeamRecommendation] =
  useState<TeamRecommendationResult | null>(null);

const [teamRecommendationError, setTeamRecommendationError] =
  useState("");

const [duplicateError, setDuplicateError] = useState("");
  const locateMe = async () => {
    setError("");
    setSuccess("");
    setLocating(true);

    try {
      const position = await mapService.locate();

      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
    } catch {
      setError(
        "Unable to get your location. Please allow location access in your browser and try again."
      );
    } finally {
      setLocating(false);
    }
  };

  const analyzeWithAI = async () => {
  setAnalysisError("");
  setAnalysis(null);

  if (description.trim().length < 10) {
    setAnalysisError(
      "Please enter at least 10 characters before AI analysis."
    );
    return;
  }

  setAnalyzing(true);

  try {
    const result = await aiService.analyzeIncident({
      description: description.trim(),

      ...(latitude !== null && longitude !== null
        ? {
            location: {
              latitude,
              longitude
            }
          }
        : {})
    });

    setAnalysis(result);

  } catch (err) {
    setAnalysisError(
      err instanceof Error
        ? err.message
        : "Unable to analyze incident with AI."
    );

  } finally {
    setAnalyzing(false);
  }
};

const analyzeWithML = async () => {
  setMlError("");
  setMlPrediction(null);
  if (description.trim().length < 10) {
    setMlError("Please enter at least 10 characters.");
    return;
  }
  setMlAnalyzing(true);
  try {
    const result = await mlAiService.predict(description.trim());
    setMlPrediction(result);
  } catch (err) {
    setMlError(err instanceof Error ? err.message : "ML service unavailable.");
  } finally {
    setMlAnalyzing(false);
  }
};

const checkForDuplicates = async () => {
  setDuplicateError("");
  setDuplicateResult(null);

  if (title.trim().length < 5) {
    setDuplicateError("Please enter a valid incident title.");
    return;
  }

  if (description.trim().length < 10) {
    setDuplicateError("Please enter a valid incident description.");
    return;
  }

  if (latitude === null || longitude === null) {
    setDuplicateError(
      "Please capture your incident location first."
    );
    return;
  }

  setCheckingDuplicates(true);

  try {
    const result = await aiService.checkDuplicates({
      title: title.trim(),
      description: description.trim(),
      category,
      location: {
        latitude,
        longitude
      }
    });

    setDuplicateResult(result);
  } catch (err) {
    setDuplicateError(
      err instanceof Error
        ? err.message
        : "Unable to check duplicate incidents."
    );
  } finally {
    setCheckingDuplicates(false);
  }
};
const recommendTeamsWithAI = async () => {
  setTeamRecommendationError("");
  setTeamRecommendation(null);

  if (title.trim().length < 5) {
    setTeamRecommendationError("Please enter a valid incident title.");
    return;
  }

  if (description.trim().length < 10) {
    setTeamRecommendationError("Please enter a valid incident description.");
    return;
  }

  if (latitude === null || longitude === null) {
    setTeamRecommendationError(
      "Please capture your incident location first."
    );
    return;
  }

  setRecommendingTeams(true);

  try {
    const result = await aiService.recommendTeams({
      title: title.trim(),
      description: description.trim(),
      category,
      priority: analysis?.priority ?? "medium",
      location: {
        latitude,
        longitude
      }
    });

    setTeamRecommendation(result);
  } catch (err) {
    setTeamRecommendationError(
      err instanceof Error
        ? err.message
        : "Unable to recommend response teams."
    );
  } finally {
    setRecommendingTeams(false);
  }
};

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (title.trim().length < 5) {
      setError("Title must contain at least 5 characters.");
      return;
    }

    if (description.trim().length < 10) {
      setError("Description must contain at least 10 characters.");
      return;
    }

    if (latitude === null || longitude === null) {
      setError("Please capture your current location first.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await incidentService.create({
        title: title.trim(),
        description: description.trim(),
        category,
        location: {
          latitude,
          longitude,
        },
      });

      setSuccess(
        result.message || "Incident reported successfully."
      );

      setTitle("");
      setDescription("");
      setCategory("other");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to report incident."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="content-wrap">
      <section className="panel full-panel">
        <div className="panel-head">
          <div>
            <div className="eyebrow">CIVICCONNECT CITIZEN PORTAL</div>
            <h3>Report an Incident</h3>
            <p>Report an emergency or civic incident to the response team.</p>
          </div>

          <Link
            to="/citizen/feedback"
            className="btn btn-secondary"
          >
            Feedback & Ratings
          </Link>
        </div>

        <form
          className="form-grid"
          onSubmit={handleSubmit}
          style={{ marginTop: "22px" }}
        >
          <label className="full">
            Incident title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Road accident near Sector 5"
              minLength={5}
              required
            />
          </label>

          <label className="full">
            Incident category
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as Category)
              }
            >
              <option value="fire">Fire</option>
              <option value="accident">Accident</option>
              <option value="medical">Medical</option>
              <option value="crime">Crime</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="full">
            Description
            <textarea
              rows={5}
              value={description}
onChange={(e) => {
  setDescription(e.target.value);
  setAnalysis(null);
  setAnalysisError("");
  setMlPrediction(null);
  setMlError("");
  setDuplicateResult(null);
  setDuplicateError("");
  setTeamRecommendation(null);
setTeamRecommendationError("");
}}
              placeholder="Describe what happened and any important details..."
              minLength={10}
              maxLength={3000}
              required
            />
          </label>

          {/* AI Incident Analysis */}
<div className="full">

  <button
    type="button"
    className="btn btn-secondary"
    onClick={() => void analyzeWithAI()}
    disabled={
      analyzing ||
      submitting ||
      description.trim().length < 10
    }
  >
    <Sparkles size={15} />

    {analyzing
      ? "Analyzing incident..."
      : "Analyze description with AI"}
  </button>

  {analysisError && (
    <p
      role="alert"
      style={{
        color: "#f28c8c",
        fontSize: "12px",
        marginTop: "10px"
      }}
    >
      {analysisError}
    </p>
  )}

  {analysis && (
    <div
      style={{
        marginTop: "16px",
        padding: "18px",
        border: "1px solid #43b7a1",
        borderRadius: "12px",
        background: "rgba(67, 183, 161, 0.06)"
      }}
    >
      <h3 style={{ marginTop: 0 }}>
        <Sparkles size={16} /> AI Incident Analysis
      </h3>

      <p>
        <b>Suggested Category:</b>{" "}
        {analysis.category.toUpperCase()}
      </p>

      <p>
        <b>Suggested Priority:</b>{" "}
        {analysis.priority.toUpperCase()}
      </p>

      <p>
        <b>Summary:</b> {analysis.summary}
      </p>

      <p>
        <b>Recommended Action:</b>{" "}
        {analysis.recommendedAction}
      </p>

      <p>
        <b>AI Confidence:</b>{" "}
        {(analysis.confidence * 100).toFixed(1)}%
      </p>

      <p style={{ fontSize: "12px", color: "#91a3bc" }}>
        Advisory suggestion only. Please review the
        recommendation before submitting your incident.
      </p>

      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setCategory(analysis.category)}
      >
        Apply suggested category
      </button>
    </div>
  )}

</div>

{/* Additional Python ML classifier; independent from existing Gemini analysis */}
<div className="full">
  <button type="button" className="btn btn-secondary" onClick={() => void analyzeWithML()} disabled={mlAnalyzing || submitting || description.trim().length < 10}>
    <Sparkles size={15} /> {mlAnalyzing ? "Running ML classifier..." : "Run ML Category & Priority Prediction"}
  </button>
  {mlError && <p role="alert" style={{ color: "#f28c8c", fontSize: "12px", marginTop: "10px" }}>{mlError}</p>}
  {mlPrediction && <div style={{ marginTop: "16px", padding: "18px", border: "1px solid #6b8bd6", borderRadius: "12px", background: "rgba(107,139,214,0.06)" }}>
    <h3 style={{ marginTop: 0 }}><Sparkles size={16} /> ML Complaint Intelligence</h3>
    <p><b>ML Category:</b> {mlPrediction.category}</p>
    <p><b>Confidence:</b> {(mlPrediction.confidence * 100).toFixed(1)}%</p>
    <p><b>Suggested Priority:</b> {mlPrediction.priority}</p>
    <p><b>Reason:</b> {mlPrediction.priority_reason}</p>
    <p><b>Model:</b> {mlPrediction.model_version}</p>
    <p style={{ fontSize: "12px", color: "#91a3bc" }}>{mlPrediction.advisory} ML categories are a separate taxonomy and are not automatically written into the existing incident category.</p>
    <div style={{ marginTop: "10px" }}><b>Category probabilities</b>{Object.entries(mlPrediction.probabilities).sort((a,b) => b[1]-a[1]).map(([name,value]) => <p key={name} style={{ margin: "6px 0" }}>{name}: {(value*100).toFixed(1)}%</p>)}</div>
  </div>}
</div>

{/* AI Duplicate Incident Detection */}

<div className="full">
  <button
    type="button"
    className="btn btn-secondary"
    onClick={() => void checkForDuplicates()}
    disabled={
      checkingDuplicates ||
      submitting ||
      locating ||
      title.trim().length < 5 ||
      description.trim().length < 10 ||
      latitude === null ||
      longitude === null
    }
  >
    <Sparkles size={15} />

    {checkingDuplicates
      ? "Checking nearby incidents..."
      : "Check for Duplicate Incidents"}
  </button>

  {duplicateError && (
    <p
      role="alert"
      style={{
        color: "#f28c8c",
        fontSize: "12px",
        marginTop: "10px"
      }}
    >
      {duplicateError}
    </p>
  )}

  {duplicateResult && (
    <div
      style={{
        marginTop: "16px",
        padding: "18px",
        border: "1px solid #43b7a1",
        borderRadius: "12px"
      }}
    >
      <h3 style={{ marginTop: 0 }}>
        <Sparkles size={16} />
        Duplicate Incident Check
      </h3>

      <p>{duplicateResult.message}</p>

      {duplicateResult.possibleDuplicates.length === 0 && (
        <p style={{ color: "#43b7a1" }}>
          No likely duplicate incidents were found
          among the nearby recent reports checked.
        </p>
      )}

      {duplicateResult.possibleDuplicates.map((incident) => (
        <div
          key={incident.id}
          style={{
            padding: "14px",
            marginTop: "12px",
            border: "1px solid rgba(145,163,188,0.3)",
            borderRadius: "10px"
          }}
        >
          <h4>{incident.title}</h4>

          <p>
            <b>Category:</b> {incident.category}
          </p>

          <p>
            <b>Status:</b> {incident.status.replace("_", " ")}
          </p>

          <p>
            <b>Distance:</b>{" "}
            {incident.distanceKm.toFixed(2)} km
          </p>

          <p>
            <b>Similarity:</b> {incident.similarity}%
          </p>

          <p>
            <b>Reason:</b> {incident.reason}
          </p>
        </div>
      ))}

      <p
        style={{
          fontSize: "12px",
          color: "#91a3bc",
          marginTop: "14px"
        }}
      >
        These are AI-generated possible matches, not
        confirmed duplicates. You can still submit
        your incident.
      </p>
    </div>
  )}
</div>

{}

<div className="full">
  <button
    type="button"
    className="btn btn-secondary"
    onClick={() => void recommendTeamsWithAI()}
    disabled={
      recommendingTeams ||
      submitting ||
      locating ||
      title.trim().length < 5 ||
      description.trim().length < 10 ||
      latitude === null ||
      longitude === null
    }
  >
    <Sparkles size={15} />

    {recommendingTeams
      ? "Recommending response teams..."
      : "Recommend Response Teams with AI"}
  </button>

  {teamRecommendationError && (
    <p
      role="alert"
      style={{
        color: "#f28c8c",
        fontSize: "12px",
        marginTop: "10px"
      }}
    >
      {teamRecommendationError}
    </p>
  )}

  {teamRecommendation && (
    <div
      style={{
        marginTop: "16px",
        padding: "18px",
        border: "1px solid #43b7a1",
        borderRadius: "12px"
      }}
    >
      <h3 style={{ marginTop: 0 }}>
        <Sparkles size={16} /> AI Response Team Recommendations
      </h3>

      <p>{teamRecommendation.message}</p>

      {teamRecommendation.recommendations.length === 0 && (
        <p style={{ color: "#91a3bc" }}>
          No suitable available teams were found.
          Check whether response teams have availability
          and location information configured.
        </p>
      )}

      {teamRecommendation.recommendations.map((team) => (
        <div
          key={team.teamId}
          style={{
            padding: "15px",
            marginTop: "12px",
            border: "1px solid rgba(145,163,188,0.3)",
            borderRadius: "10px"
          }}
        >
          <h4 style={{ marginTop: 0 }}>
            {team.teamName}
          </h4>

          <p>
            <b>Department:</b> {team.departmentName}
          </p>

          <p>
            <b>Role:</b> {team.role.toUpperCase()}
          </p>

          <p>
            <b>Distance:</b> {team.distanceKm.toFixed(2)} km
          </p>

          <p>
            <b>Team members:</b> {team.membersCount}
          </p>

          <p>
            <b>AI recommendation score:</b> {team.score}/100
          </p>

          <p>
            <b>Reason:</b> {team.reason}
          </p>
        </div>
      ))}

      <p
        style={{
          fontSize: "12px",
          color: "#91a3bc",
          marginTop: "14px"
        }}
      >
        AI-generated recommendations only. Teams are not
        automatically assigned or dispatched.
      </p>
    </div>
  )}
</div>

          <div className="full">
            <b>Incident location</b>

            <p style={{ fontSize: "11px", color: "#91a3bc" }}>
              Capture your current location to report the incident.
            </p>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void locateMe()}
              disabled={locating}
              style={{ marginTop: "10px" }}
            >
              {locating ? (
                <RefreshCw size={15} />
              ) : (
                <MapPin size={15} />
              )}
              {locating ? "Finding location..." : "Use my current location"}
            </button>

            {latitude !== null && longitude !== null && (
              <p
                style={{
                  color: "#43b7a1",
                  fontSize: "12px",
                  marginTop: "12px",
                }}
              >
                <MapPin size={13} />
                Location captured: {latitude.toFixed(5)},{" "}
                {longitude.toFixed(5)}
              </p>
            )}
          </div>

          {error && (
            <p
              className="full"
              role="alert"
              style={{ color: "#f28c8c", fontSize: "12px" }}
            >
              {error}
            </p>
          )}

          {success && (
            <div
              className="full"
              role="status"
              style={{ color: "#43b7a1", fontSize: "13px" }}
            >
              {success}
              <p>
                Your incident has been submitted for municipal response.
                You can now wait for the Admin/Operator to review it.
              </p>
            </div>
          )}

          <div className="modal-actions full">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || locating}
            >
              <Send size={15} />
              {submitting ? "Submitting..." : "Report incident"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}