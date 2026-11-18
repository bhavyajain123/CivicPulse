import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  MapPin,
  Radio,
  Clock3,
  Navigation,
  ShieldCheck
} from "lucide-react";

import {
  incidentService,
  type Incident
} from "../../services/incidentService";

import type { ResponseTeam } from "../../services/teamService";

import { socketService } from "../../services/socketService";
import { useAuthContext } from "../../context/AuthContext";
import LiveOperationsMap from "../../components/maps/LiveOperationsMap";

const STATUS_STEPS = [
  { value: "pending", label: "Reported" },
  { value: "verified", label: "Verified" },
  { value: "assigned", label: "Team Assigned" },
  { value: "in_progress", label: "Work In Progress" },
  { value: "resolved", label: "Resolved" }
];

export default function LiveTracking() {
  const { user } = useAuthContext();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [joined, setJoined] = useState(false);

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await incidentService.getMine();

      setIncidents(data);

      setSelectedIncidentId(current =>
        current && data.some(item => item._id === current)
          ? current
          : data[0]?._id || ""
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your incidents."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIncidents();
  }, [loadIncidents]);

  const selectedIncident = useMemo(
    () =>
      incidents.find(item => item._id === selectedIncidentId) || null,
    [incidents, selectedIncidentId]
  );

  // Connect citizen to the selected incident's authorized socket room.
  useEffect(() => {
    if (!user?.token || !selectedIncidentId) {
      setSocketConnected(false);
      setJoined(false);
      return;
    }

    const socket = socketService.connect(user.token);

    const joinRoom = () => {
      setSocketConnected(true);
      socket.emit("join-incident", selectedIncidentId);
    };

    const onDisconnect = () => {
      setSocketConnected(false);
      setJoined(false);
    };

    const onJoined = (data: { incidentId: string }) => {
      if (data.incidentId === selectedIncidentId) {
        setJoined(true);
      }
    };

    const onLocationUpdate = (data: {
      teamId: string;
      incidentId: string;
      latitude: number;
      longitude: number;
      updatedAt: string | Date;
    }) => {
      if (data.incidentId !== selectedIncidentId) return;

      const updatedAt =
        data.updatedAt instanceof Date
          ? data.updatedAt.toISOString()
          : data.updatedAt;

      setIncidents(previous =>
        previous.map(incident => {
          if (incident._id !== selectedIncidentId) {
            return incident;
          }

          const assignedTeam = incident.assignedTeam;

if (!assignedTeam) {
  return incident;
}

          if (
            assignedTeam._id &&
            assignedTeam._id !== data.teamId
          ) {
            return incident;
          }

          return {
            ...incident,
            assignedTeam: {
              ...assignedTeam,
              currentLocation: {
                latitude: data.latitude,
                longitude: data.longitude,
                updatedAt
              }
            }
          };
        })
      );
    };

    const onIncidentUpdated = (data: { incidentId: string }) => {
      if (data.incidentId === selectedIncidentId) {
        void loadIncidents();
      }
    };

    const onSocketError = (data: { message?: string }) => {
      setJoined(false);
      setError(data?.message || "Live tracking connection failed.");
    };

    socket.on("connect", joinRoom);
    socket.on("disconnect", onDisconnect);
    socket.on("incident-joined", onJoined);
    socket.on("team-location-updated", onLocationUpdate);
    socket.on("incident-updated", onIncidentUpdated);
    socket.on("socket-error", onSocketError);

    if (socket.connected) {
      joinRoom();
    }

    return () => {
      socket.emit("leave-incident", selectedIncidentId);

      socket.off("connect", joinRoom);
      socket.off("disconnect", onDisconnect);
      socket.off("incident-joined", onJoined);
      socket.off("team-location-updated", onLocationUpdate);
      socket.off("incident-updated", onIncidentUpdated);
      socket.off("socket-error", onSocketError);

     
    };
  }, [user?.token, selectedIncidentId, loadIncidents]);

const assignedTeam = selectedIncident?.assignedTeam ?? null;

  const mapTeams: ResponseTeam[] = assignedTeam?._id
    ? [
        {
          _id: assignedTeam._id,
          name: assignedTeam.name || "Response Team",
          isAvailable: assignedTeam.isAvailable ?? false,
          currentLocation: assignedTeam.currentLocation
        }
      ]
    : [];

  const currentStatusIndex = selectedIncident
    ? STATUS_STEPS.findIndex(
        step => step.value === selectedIncident.status
      )
    : -1;

  const hasTeamLocation =
    typeof assignedTeam?.currentLocation?.latitude === "number" &&
    typeof assignedTeam?.currentLocation?.longitude === "number";

  const locationUpdatedAt =
    assignedTeam?.currentLocation?.updatedAt;

  return (
    <main className="content-wrap">
      <section className="panel full-panel">

        <div className="panel-head">
          <div>
            <div className="eyebrow">
              CIVICCONNECT CITIZEN PORTAL
            </div>

            <h2>Live Incident Tracking</h2>

            <p>
              Monitor your reported incident and response team progress.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void loadIncidents()}
            disabled={loading}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="empty-state">
            <b>Tracking information unavailable</b>
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="empty-state">
            <b>Loading your incidents...</b>
          </div>
        )}

        {!loading && !error && incidents.length === 0 && (
          <div className="empty-state">
            <MapPin size={28} />
            <b>No incidents reported yet</b>
            <span>Your reported incidents will appear here.</span>
          </div>
        )}

        {!loading && incidents.length > 0 && (
          <>
            <label className="full" style={{ marginTop: "20px" }}>
              Select your incident

              <select
                value={selectedIncidentId}
                onChange={e =>
                  setSelectedIncidentId(e.target.value)
                }
              >
                {incidents.map(incident => (
                  <option key={incident._id} value={incident._id}>
                    {incident.title} · {incident.status.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>

            {selectedIncident && (
              <>
                <div
                  className="stats-grid"
                  style={{ marginTop: "20px" }}
                >
                  <div className="stat-card">
                    <span>Incident</span>
                    <h3>{selectedIncident.title}</h3>
                  </div>

                  <div className="stat-card">
                    <span>Priority</span>
                    <h3>{selectedIncident.priority.toUpperCase()}</h3>
                  </div>

                  <div className="stat-card">
                    <span>Status</span>
                    <h3>
                      {selectedIncident.status
                        .replace("_", " ")
                        .toUpperCase()}
                    </h3>
                  </div>

                  <div className="stat-card">
                    <span>Response Team</span>
                    <h3>
                      {assignedTeam?.name || "Not assigned"}
                    </h3>
                  </div>
                </div>

                <section
                  className="panel"
                  style={{ marginTop: "20px" }}
                >
                  <div className="panel-head">
                    <div>
                      <h3>Incident Progress</h3>
                      <p>Track each stage of your incident.</p>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: "15px" }}>
                    {STATUS_STEPS.map((step, index) => {
                      const completed =
                        currentStatusIndex >= index;

                      const active =
                        currentStatusIndex === index;

                      return (
                        <div
                          key={step.value}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px"
                          }}
                        >
                          <ShieldCheck
                            size={20}
                            color={completed ? "#42c39b" : "#64748b"}
                          />

                          <span
                            style={{
                              color: completed ? "#42c39b" : "#91a3bc",
                              fontWeight: active ? 700 : 400
                            }}
                          >
                            {step.label}
                            {active ? " — Current status" : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section
                  className="panel"
                  style={{ marginTop: "20px" }}
                >
                  <div className="panel-head">
                    <div>
                      <h3>Response Team Live Location</h3>
                      <p>
                        Your assigned team's latest available GPS location.
                      </p>
                    </div>

                    <span
                      className={`badge ${
                        socketConnected && joined ? "green" : "red"
                      }`}
                    >
                      <Radio size={12} />
                      {socketConnected && joined
                        ? "LIVE CONNECTED"
                        : "CONNECTING"}
                    </span>
                  </div>

                  <div style={{ marginTop: "15px" }}>
                    {hasTeamLocation ? (
                      <>
                        <LiveOperationsMap
                          incidents={[selectedIncident]}
                          teams={mapTeams}
                        />

                        <div
                          style={{
                            marginTop: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap"
                          }}
                        >
                          <Navigation size={15} color="#42c39b" />

                          <span>
                            Latest location received
                          </span>

                          <Clock3 size={14} />

                          <span>
                            {locationUpdatedAt
                              ? new Date(
                                  locationUpdatedAt
                                ).toLocaleString()
                              : "Time unavailable"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="empty-state">
                        <MapPin size={28} />

                        <b>
                          {assignedTeam
                            ? "Team GPS location not shared yet"
                            : "Response team not assigned yet"}
                        </b>

                        <span>
                          {assignedTeam
                            ? "The map will display the team's location when GPS tracking starts."
                            : "The response team location will become available after assignment and GPS sharing."}
                        </span>

                        {selectedIncident.location.address && (
                          <p>
                            Incident location:{" "}
                            {selectedIncident.location.address}
                          </p>
                        )}

                        <LiveOperationsMap
                          incidents={[selectedIncident]}
                          teams={[]}
                        />
                      </div>
                    )}
                  </div>
                </section>
                                {/* Incident Resolution Proof */}
                {(selectedIncident.status === "resolved" ||
                  Boolean(selectedIncident.resolutionRemarks?.trim()) ||
                  (selectedIncident.resolutionImages?.length ?? 0) > 0) && (
                  <section
                    className="panel"
                    style={{ marginTop: "20px" }}
                  >
                    <div className="panel-head">
                      <div>
                        <h3>Incident Resolution Proof</h3>
                        <p>
                          View the response team's resolution details
                          and after-work photos.
                        </p>
                      </div>

                      <span className="badge green">
                        <ShieldCheck size={12} />
                        RESOLVED
                      </span>
                    </div>

                    <div style={{ marginTop: "18px" }}>
                      <h4>Resolution Remarks</h4>

                      <p
                        style={{
                          marginTop: "10px",
                          lineHeight: 1.7,
                          whiteSpace: "pre-wrap"
                        }}
                      >
                        {selectedIncident.resolutionRemarks?.trim() ||
                          "No resolution remarks provided."}
                      </p>
                    </div>

                    <div
                      style={{
                        marginTop: "18px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}
                    >
                      <Clock3 size={16} />

                      <span>
                        Resolved on:{" "}
                        {selectedIncident.resolvedAt
                          ? new Date(
                              selectedIncident.resolvedAt
                            ).toLocaleString()
                          : "Time unavailable"}
                      </span>
                    </div>

                    <div style={{ marginTop: "22px" }}>
                      <h4>After-Work Photos</h4>

                      {selectedIncident.resolutionImages?.length ? (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: "14px",
                            marginTop: "14px"
                          }}
                        >
                          {selectedIncident.resolutionImages.map(
                            (image, index) => (
                              <a
                                key={image.publicId || image.url}
                                href={image.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View full image"
                              >
                                <img
                                  src={image.url}
                                  alt={`Resolution proof ${index + 1}`}
                                  loading="lazy"
                                  style={{
                                    width: "100%",
                                    height: "190px",
                                    objectFit: "cover",
                                    borderRadius: "12px",
                                    border: "1px solid #64748b"
                                  }}
                                />
                              </a>
                            )
                          )}
                        </div>
                      ) : (
                        <div
                          className="empty-state"
                          style={{ marginTop: "12px" }}
                        >
                          <span>
                            No after-work photos were uploaded.
                          </span>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}