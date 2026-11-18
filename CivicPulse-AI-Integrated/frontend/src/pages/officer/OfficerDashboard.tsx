
import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import {
  assignmentService,
  type Assignment,
  type PopulatedIncident,
  type AssignmentStatus
} from "../../services/assignmentService";
import {
  CheckCircle2,
  Play,
  RefreshCw,
  XCircle
} from "lucide-react";
import { socketService } from "../../services/socketService";
import { useAuthContext } from "../../context/AuthContext";
import { incidentService } from "../../services/incidentService";

export default function OfficerDashboard() {
  const { user } = useAuthContext();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
const [loadingAssignments, setLoadingAssignments] = useState(true);
const [updatingAssignmentId, setUpdatingAssignmentId] =
  useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastPosition, setLastPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [resolutionAssignmentId, setResolutionAssignmentId] =
  useState<string | null>(null);

const [resolutionRemarks, setResolutionRemarks] = useState("");

const [resolutionFiles, setResolutionFiles] = useState<File[]>([]);

const [resolutionSaving, setResolutionSaving] = useState(false);
const [photoIncidentId, setPhotoIncidentId] =
  useState<string | null>(null);

const [additionalResolutionFiles, setAdditionalResolutionFiles] =
  useState<File[]>([]);

const [additionalPhotosSaving, setAdditionalPhotosSaving] =
  useState(false);

  const socketRef = useRef<ReturnType<typeof socketService.connect> | null>(null);
  const watchIdRef = useRef<number | null>(null);
const refreshAssigned = useCallback(async () => {
  setLoadingAssignments(true);

  try {
    const data = await assignmentService.getMy();

    setAssignments(data);
    setError("");
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to load team assignments"
    );
  } finally {
    setLoadingAssignments(false);
  }
}, []);

const getAssignmentIncident = (
  assignment: Assignment
): PopulatedIncident | null => {
  const incident = assignment.incidentId;

  return typeof incident === "object" && incident !== null
    ? incident
    : null;
};

  useEffect(() => {
    if (!user?.token) {
      setError("Please login with your response team account.");
      return;
    }

    void refreshAssigned();

    const socket = socketService.connect(user.token);
    socketRef.current = socket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onConnectError = (err: Error) => {
      setConnected(false);
      setError(`Connection failed: ${err.message}`);
    };

    const onLocationSaved = () => {
      setMessage("GPS location successfully shared with command center.");
    };

    const onSocketError = (data: { message?: string }) => {
      setError(data?.message || "GPS update failed.");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("team-location-saved", onLocationSaved);
    socket.on("socket-error", onSocketError);

    if (socket.connected) setConnected(true);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(watchIdRef.current);
      }

      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("team-location-saved", onLocationSaved);
      socket.off("socket-error", onSocketError);

      socketService.disconnect();
      socketRef.current = null;
    };
  }, [user?.token, refreshAssigned]);

const activeAssignment =
  assignments.find(a => a.status === "in_progress") ||
  assignments.find(a => a.status === "accepted") ||
  assignments.find(a => a.status === "assigned");

const activeIncident = activeAssignment
  ? getAssignmentIncident(activeAssignment)
  : null;

  const handleAssignmentStatus = async (
  assignmentId: string,
  status: Extract<
    AssignmentStatus,
    "accepted" | "in_progress" | "completed" | "cancelled"
  >
) => {
  setUpdatingAssignmentId(assignmentId);
  setError("");
  setMessage("");

  try {
    await assignmentService.updateStatus(assignmentId, {
      status
    });

    const statusLabels: Record<string, string> = {
      accepted: "Assignment accepted successfully.",
      in_progress: "Work marked as in progress.",
      completed: "Assignment completed successfully.",
      cancelled: "Assignment cancelled successfully."
    };

    setMessage(statusLabels[status]);

    if (status === "completed" || status === "cancelled") {
      stopTracking();
    }

    await refreshAssigned();

  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to update assignment status."
    );
  } finally {
    setUpdatingAssignmentId(null);
  }
};
const submitResolution = async () => {
  if (!resolutionAssignmentId) return;

  if (!resolutionRemarks.trim()) {
    setError("Please enter resolution remarks.");
    return;
  }

  if (resolutionFiles.length > 5) {
    setError("You can upload a maximum of 5 images.");
    return;
  }

  const invalidFile = resolutionFiles.find(
    (file) =>
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
  );

  if (invalidFile) {
    setError("Only JPG, PNG and WEBP images up to 5MB are allowed.");
    return;
  }

  try {
    setResolutionSaving(true);
    setError("");
    setMessage("");

    await assignmentService.completeWithProof(
      resolutionAssignmentId,
      resolutionRemarks.trim(),
      resolutionFiles
    );

    setMessage("Incident resolved and proof submitted successfully.");

    setResolutionAssignmentId(null);
    setResolutionRemarks("");
    setResolutionFiles([]);

    stopTracking();
    await refreshAssigned();
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Failed to submit resolution proof."
    );
  } finally {
    setResolutionSaving(false);
  }
};

const submitAdditionalPhotos = async () => {
  if (!photoIncidentId) return;

  if (additionalResolutionFiles.length === 0) {
    setError("Please select at least one photo.");
    return;
  }

  if (additionalResolutionFiles.length > 5) {
    setError("You can upload a maximum of 5 photos.");
    return;
  }

  const invalidFile = additionalResolutionFiles.find(
    (file) =>
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
  );

  if (invalidFile) {
    setError("Only JPG, PNG and WEBP images up to 5MB are allowed.");
    return;
  }

  try {
    setAdditionalPhotosSaving(true);
    setError("");
    setMessage("");

    await incidentService.addResolutionPhotos(
      photoIncidentId,
      additionalResolutionFiles
    );

    setMessage("Additional resolution photos uploaded successfully.");

    setPhotoIncidentId(null);
    setAdditionalResolutionFiles([]);

    await refreshAssigned();

  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Failed to upload additional photos."
    );
  } finally {
    setAdditionalPhotosSaving(false);
  }
};


  const startTracking = () => {
    setError("");
    setMessage("");

    if (!activeIncident) {
      setError("No active assigned incident found.");
      return;
    }

    if (!navigator.geolocation) {
      setError("GPS is not supported by this browser.");
      return;
    }

    if (!socketRef.current?.connected) {
      setError("Live connection is not ready. Please retry.");
      return;
    }

    setTracking(true);

    const watchId = navigator.geolocation.watchPosition(
      position => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setLastPosition({ latitude, longitude });

        socketRef.current?.emit("update-team-location", {
          incidentId: activeIncident._id,
          latitude,
          longitude
        });
      },
      geoError => {
        setTracking(false);
        setError(`GPS error: ${geoError.message}`);

        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000
      }
    );

    watchIdRef.current = watchId;
    setMessage("GPS tracking started. Waiting for location updates...");
  };


   const testAdvancedTracking = () => {
  console.log("[SOCKET TEST] Button clicked:", {
    connected: socketRef.current?.connected,
    socketId: socketRef.current?.id,
    incidentId: activeIncident?._id,
    tracking
  }); 
  setError("");
  setMessage("");

  const incidentId = activeIncident?._id;
  const socket = socketRef.current;

  if (!incidentId) {
    setError("No active assigned incident found.");
    return;
  }

  if (!socket?.connected) {
    setError("Socket is not connected.");
    return;
  }

  if (tracking) {
    setError("Stop regular GPS tracking before this test.");
    return;
  }

  if (!navigator.geolocation) {
    setError("GPS is not supported by this browser.");
    return;
  }

  socket.emit("tracking:start", { incidentId }, (startAck) => {
    console.log("[SOCKET TEST] tracking:start ack:", startAck);

    if (!startAck.ok) {
      setError(startAck.message || "Tracking start failed.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const payload = {
          incidentId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        setLastPosition({
          latitude: payload.latitude,
          longitude: payload.longitude
        });

        socket.emit("tracking:location", payload, (locationAck) => {
          console.log(
            "[SOCKET TEST] tracking:location ack:",
            locationAck
          );

          if (locationAck.ok) {
            setMessage("Advanced tracking location updated successfully.");
          } else {
            setError(locationAck.message || "Location update failed.");
          }

          socket.emit("tracking:stop", { incidentId }, (stopAck) => {
            console.log(
              "[SOCKET TEST] tracking:stop ack:",
              stopAck
            );
          });
        });
      },
      (geoError) => {
        setError(`GPS test failed: ${geoError.message}`);

        socket.emit("tracking:stop", { incidentId }, (stopAck) => {
          console.log(
            "[SOCKET TEST] tracking:stop ack:",
            stopAck
          );
        });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000
      }
    );
  });
};

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setTracking(false);
    setMessage("GPS tracking stopped.");
  };

  return (
    <main className="content-wrap" style={{ maxWidth: "1100px" }}>
      <div className="page-heading">
        <div>
          <div className="eyebrow">RESPONSE TEAM WORKSPACE</div>
          <h1>Officer Dashboard</h1>
          <p>View assigned incidents and share your live GPS location.</p>
        </div>

        <span className={`badge ${connected ? "green" : "red"}`}>
          {connected ? "SOCKET CONNECTED" : "DISCONNECTED"}
        </span>
      </div>

      <section className="panel" style={{ marginBottom: "16px" }}>
        <div className="panel-head">
          <div>
            <h3>GPS Location Tracking</h3>
            <p>
              Your location is shared only while tracking is enabled.
            </p>
          </div>
        </div>

     <div style={{ marginTop: "20px" }}>
  {tracking ? (
    <button
      className="btn btn-secondary"
      onClick={stopTracking}
    >
      Stop GPS Tracking
    </button>
  ) : (
    <button
      className="btn btn-primary"
      onClick={startTracking}
      disabled={!connected || !activeIncident}
    >
      Start GPS Tracking
    </button>
  )}

  <button
    type="button"
    className="btn btn-secondary"
    style={{ marginTop: "12px" }}
    onClick={testAdvancedTracking}
    disabled={!connected || !activeIncident || tracking}
  >
    Test Advanced Socket Tracking
  </button>
</div>

        {lastPosition && (
          <div style={{ marginTop: "15px", fontSize: "11px", color: "#91a3bc" }}>
            Latitude: {lastPosition.latitude.toFixed(6)}
            <br />
            Longitude: {lastPosition.longitude.toFixed(6)}
          </div>
        )}

        {message && (
          <p style={{ color: "#68d2b0", fontSize: "11px", marginTop: "14px" }}>
            {message}
          </p>
        )}

        {error && (
          <p role="alert" style={{ color: "#f28c8c", fontSize: "11px", marginTop: "14px" }}>
            {error}
          </p>
        )}
      </section>

<section className="panel">

  <div className="panel-head">
    <div>
      <h3>My Assigned Incidents</h3>
      <p>{assignments.length} assignments from backend</p>
    </div>

    <button
      className="btn btn-secondary"
      onClick={() => void refreshAssigned()}
      disabled={loadingAssignments}
    >
      <RefreshCw size={15} />
      Refresh
    </button>
  </div>

  <div className="feed-list">

    {loadingAssignments && (
      <div className="empty-state">
        <b>Loading team assignments...</b>
      </div>
    )}

    {!loadingAssignments && error && assignments.length === 0 && (
      <div className="empty-state">
        <b>Unable to load assignments</b>
        <span>{error}</span>
      </div>
    )}

    {!loadingAssignments && !error && assignments.length === 0 && (
      <div className="empty-state">
        <b>No assigned incidents</b>
        <span>New assignments will appear here.</span>
      </div>
    )}

    {!loadingAssignments && assignments.map(assignment => {
      const incident = getAssignmentIncident(assignment);

      return (
        <div
          className="feed-item"
          key={assignment._id}
          style={{
            alignItems: "flex-start",
            flexWrap: "wrap"
          }}
        >
          <span
            className={`feed-priority ${
              incident?.priority || "medium"
            }`}
          />

          <div style={{ flex: 1, minWidth: "180px" }}>

            <b>
              {incident?.title || "Incident details unavailable"}
            </b>

            <span>
              {incident?.location?.address || "Location unavailable"}
            </span>

            <small>
              {incident?.category || "Incident"} ·
              {" "}
              {assignment.status.replace("_", " ").toUpperCase()}
            </small>

            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginTop: "12px"
              }}
            >

              {assignment.status === "assigned" && (
                <>
                  <button
                    className="btn btn-primary"
                    disabled={updatingAssignmentId === assignment._id}
                    onClick={() =>
                      void handleAssignmentStatus(
                        assignment._id,
                        "accepted"
                      )
                    }
                  >
                    <CheckCircle2 size={14} />
                    Accept
                  </button>

                  <button
                    className="btn btn-secondary"
                    disabled={updatingAssignmentId === assignment._id}
                    onClick={() =>
                      void handleAssignmentStatus(
                        assignment._id,
                        "cancelled"
                      )
                    }
                  >
                    <XCircle size={14} />
                    Cancel
                  </button>
                </>
              )}

              {assignment.status === "accepted" && (
                <>
                  <button
                    className="btn btn-primary"
                    disabled={updatingAssignmentId === assignment._id}
                    onClick={() =>
                      void handleAssignmentStatus(
                        assignment._id,
                        "in_progress"
                      )
                    }
                  >
                    <Play size={14} />
                    Start Work
                  </button>

                  <button
                    className="btn btn-secondary"
                    disabled={updatingAssignmentId === assignment._id}
                    onClick={() =>
                      void handleAssignmentStatus(
                        assignment._id,
                        "cancelled"
                      )
                    }
                  >
                    <XCircle size={14} />
                    Cancel
                  </button>
                </>
              )}

              {assignment.status === "in_progress" && (
                <button
                  className="btn btn-primary"
                  disabled={updatingAssignmentId === assignment._id}
                 onClick={() => {
  setResolutionAssignmentId(assignment._id);
  setResolutionRemarks("");
  setResolutionFiles([]);
  setError("");
  setMessage("");
}}
                >
                  <CheckCircle2 size={14} />
                  Mark Complete
                </button>
              )}

              {assignment.status === "completed" && (
  <button
    type="button"
    className="btn btn-secondary"
    onClick={() => {
      const incidentId =
        typeof assignment.incidentId === "string"
          ? assignment.incidentId
          : assignment.incidentId._id;

      setPhotoIncidentId(incidentId);
      setAdditionalResolutionFiles([]);
      setError("");
      setMessage("");
    }}
  >
    <ImagePlus size={16} />
    Add Resolution Photos
  </button>
)}

              {updatingAssignmentId === assignment._id && (
                <span>Updating assignment...</span>
              )}

            </div>
          </div>

          <span className="badge blue">
            {assignment.status.replace("_", " ").toUpperCase()}
          </span>

        </div>
      );
    })}

  </div>
</section>

{resolutionAssignmentId && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "rgba(2, 8, 23, 0.82)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      overflowY: "auto",
      backdropFilter: "blur(5px)"
    }}
  >
    <div
      style={{
        width: "100%",
        maxWidth: "560px",
        background: "#111f33",
        border: "1px solid #30445f",
        borderRadius: "16px",
        padding: "26px",
        color: "#e5edf8",
        boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
        margin: "auto"
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px"
        }}
      >
        <div>
          <span
            style={{
              fontSize: "10px",
              color: "#7e9bbd",
              fontWeight: 700,
              letterSpacing: "1.5px"
            }}
          >
            CIVICCONNECT RESPONSE TEAM
          </span>

          <h2 style={{ margin: "7px 0", fontSize: "22px" }}>
            Submit Resolution Proof
          </h2>
        </div>

        <button
          type="button"
          disabled={resolutionSaving}
          onClick={() => {
            setResolutionAssignmentId(null);
            setResolutionRemarks("");
            setResolutionFiles([]);
            setError("");
          }}
          style={{
            background: "#1c3049",
            color: "#cbd5e1",
            border: "1px solid #3b506b",
            borderRadius: "8px",
            width: "34px",
            height: "34px",
            cursor: "pointer",
            fontSize: "20px"
          }}
        >
          ×
        </button>
      </div>

      <p
        style={{
          fontSize: "13px",
          color: "#91a7c2",
          marginBottom: "24px"
        }}
      >
        Provide details of the completed work and upload
        photos as resolution evidence.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submitResolution();
        }}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px"
        }}
      >
        {/* Remarks */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "9px"
            }}
          >
            Resolution Remarks *
          </label>

          <textarea
            value={resolutionRemarks}
            onChange={(event) =>
              setResolutionRemarks(event.target.value)
            }
            placeholder="Describe the work completed and how the incident was resolved..."
            rows={5}
            maxLength={1000}
            required
            style={{
              display: "block",
              width: "100%",
              boxSizing: "border-box",
              padding: "13px",
              background: "#0b1728",
              color: "#f1f5f9",
              border: "1px solid #354b67",
              borderRadius: "10px",
              outline: "none",
              fontSize: "14px",
              lineHeight: 1.6,
              resize: "vertical",
              minHeight: "120px"
            }}
          />

          <p
            style={{
              textAlign: "right",
              fontSize: "11px",
              color: "#8299b5",
              marginTop: "6px"
            }}
          >
            {resolutionRemarks.length}/1000 characters
          </p>
        </div>

        {/* Photo Upload */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "9px"
            }}
          >
            After-Work Photos
          </label>

          <div
            style={{
              background: "#0b1728",
              border: "1px dashed #49617e",
              borderRadius: "10px",
              padding: "16px"
            }}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={resolutionSaving}
              onChange={(event) => {
                const selectedFiles = Array.from(
                  event.target.files ?? []
                );

                if (selectedFiles.length > 5) {
                  setError("You can upload a maximum of 5 images.");
                  setResolutionFiles([]);
                  event.target.value = "";
                  return;
                }

                const invalidFile = selectedFiles.find(
                  (file) =>
                    !["image/jpeg", "image/png", "image/webp"].includes(
                      file.type
                    ) ||
                    file.size > 5 * 1024 * 1024
                );

                if (invalidFile) {
                  setError(
                    "Only JPG, PNG and WEBP images up to 5 MB are allowed."
                  );
                  setResolutionFiles([]);
                  event.target.value = "";
                  return;
                }

                setError("");
                setResolutionFiles(selectedFiles);
              }}
              style={{
                display: "block",
                width: "100%",
                color: "#cbd5e1",
                fontSize: "13px"
              }}
            />

            <p
              style={{
                fontSize: "11px",
                color: "#8299b5",
                margin: "10px 0 0"
              }}
            >
              JPG, PNG or WEBP · Maximum 5 photos · 5 MB each
            </p>
          </div>

          {resolutionFiles.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              {resolutionFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  style={{
                    padding: "9px 12px",
                    marginBottom: "6px",
                    background: "#1a304b",
                    borderRadius: "7px",
                    fontSize: "12px",
                    color: "#cbd5e1",
                    overflowWrap: "anywhere"
                  }}
                >
                  {index + 1}. {file.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "12px",
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "8px",
              color: "#fca5a5",
              fontSize: "13px"
            }}
          >
            {error}
          </div>
        )}

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            paddingTop: "8px",
            borderTop: "1px solid #2b405a"
          }}
        >
          <button
            type="button"
            disabled={resolutionSaving}
            onClick={() => {
              setResolutionAssignmentId(null);
              setResolutionRemarks("");
              setResolutionFiles([]);
              setError("");
            }}
            style={{
              padding: "11px 19px",
              background: "#1c3049",
              color: "#cbd5e1",
              border: "1px solid #3b506b",
              borderRadius: "9px",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={resolutionSaving || !resolutionRemarks.trim()}
            style={{
              padding: "11px 20px",
              background: resolutionSaving ? "#31527b" : "#3478df",
              color: "#ffffff",
              border: "none",
              borderRadius: "9px",
              cursor: resolutionSaving ? "not-allowed" : "pointer",
              fontWeight: 600,
              opacity:
                resolutionSaving || !resolutionRemarks.trim() ? 0.6 : 1
            }}
          >
            {resolutionSaving
              ? "Submitting..."
              : "Submit Proof & Complete"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{photoIncidentId && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 10000,
      background: "rgba(2, 8, 23, 0.82)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      overflowY: "auto",
      backdropFilter: "blur(5px)"
    }}
  >
    <div
      style={{
        width: "100%",
        maxWidth: "520px",
        background: "#111f33",
        border: "1px solid #30445f",
        borderRadius: "16px",
        padding: "26px",
        color: "#e5edf8",
        margin: "auto",
        boxShadow: "0 25px 60px rgba(0,0,0,0.5)"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px"
        }}
      >
        <div>
          <span
            style={{
              fontSize: "10px",
              color: "#829bb8",
              letterSpacing: "1.5px",
              fontWeight: 700
            }}
          >
            CIVICCONNECT
          </span>

          <h2 style={{ margin: "7px 0", fontSize: "21px" }}>
            Add Resolution Photos
          </h2>
        </div>

        <button
          type="button"
          disabled={additionalPhotosSaving}
          onClick={() => {
            setPhotoIncidentId(null);
            setAdditionalResolutionFiles([]);
            setError("");
          }}
          style={{
            background: "#1c3049",
            color: "#cbd5e1",
            border: "1px solid #3b506b",
            borderRadius: "8px",
            width: "34px",
            height: "34px",
            cursor: "pointer",
            fontSize: "20px"
          }}
        >
          ×
        </button>
      </div>

      <p style={{ color: "#91a7c2", fontSize: "13px" }}>
        Upload additional evidence for this resolved incident.
        Existing resolution remarks and photos will be preserved.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submitAdditionalPhotos();
        }}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          marginTop: "22px"
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "9px"
            }}
          >
            Select Photos
          </label>

          <div
            style={{
              background: "#0b1728",
              border: "1px dashed #49617e",
              borderRadius: "10px",
              padding: "16px"
            }}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={additionalPhotosSaving}
              onChange={(event) => {
                const selectedFiles = Array.from(
                  event.target.files ?? []
                );

                if (selectedFiles.length > 5) {
                  setError("You can select a maximum of 5 photos.");
                  setAdditionalResolutionFiles([]);
                  event.target.value = "";
                  return;
                }

                const invalidFile = selectedFiles.find(
                  (file) =>
                    !["image/jpeg", "image/png", "image/webp"].includes(
                      file.type
                    ) ||
                    file.size > 5 * 1024 * 1024
                );

                if (invalidFile) {
                  setError(
                    "Only JPG, PNG and WEBP images up to 5 MB are allowed."
                  );
                  setAdditionalResolutionFiles([]);
                  event.target.value = "";
                  return;
                }

                setError("");
                setAdditionalResolutionFiles(selectedFiles);
              }}
              style={{
                display: "block",
                width: "100%",
                color: "#cbd5e1",
                fontSize: "13px"
              }}
            />

            <p
              style={{
                fontSize: "11px",
                color: "#8299b5",
                marginTop: "10px"
              }}
            >
              JPG, PNG or WEBP · Maximum 5 MB per photo
            </p>
          </div>
        </div>

        {additionalResolutionFiles.length > 0 && (
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600 }}>
              Selected Photos ({additionalResolutionFiles.length})
            </p>

            {additionalResolutionFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                style={{
                  padding: "9px 12px",
                  marginTop: "7px",
                  background: "#1a304b",
                  borderRadius: "7px",
                  fontSize: "12px",
                  color: "#cbd5e1",
                  overflowWrap: "anywhere"
                }}
              >
                {index + 1}. {file.name}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "12px",
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "8px",
              color: "#fca5a5",
              fontSize: "13px"
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            paddingTop: "14px",
            borderTop: "1px solid #2b405a"
          }}
        >
          <button
            type="button"
            disabled={additionalPhotosSaving}
            onClick={() => {
              setPhotoIncidentId(null);
              setAdditionalResolutionFiles([]);
              setError("");
            }}
            style={{
              padding: "11px 18px",
              background: "#1c3049",
              color: "#cbd5e1",
              border: "1px solid #3b506b",
              borderRadius: "9px",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              additionalPhotosSaving ||
              additionalResolutionFiles.length === 0
            }
            style={{
              padding: "11px 18px",
              background: "#3478df",
              color: "#ffffff",
              border: "none",
              borderRadius: "9px",
              cursor: "pointer",
              fontWeight: 600,
              opacity:
                additionalPhotosSaving ||
                additionalResolutionFiles.length === 0
                  ? 0.6
                  : 1
            }}
          >
            {additionalPhotosSaving ? "Uploading..." : "Upload Photos"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

    </main>
    
  );
}
