import { useEffect, useState } from "react";
import { RefreshCw, MapPin, AlertCircle } from "lucide-react";
import { incidentService, type Incident } from "../../services/incidentService";
import IncidentTimeline from "../../components/incidents/IncidentTimeline";

export default function CitizenDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchIncidents = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await incidentService.getMine();
      setIncidents(data);

      if (data.length > 0 && !selectedIncident) {
        setSelectedIncident(data[0]._id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to fetch your incidents."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const statusLabel = (status: Incident["status"]) => {
    return status.replace(/_/g, " ");
  };

  return (
    <section className="space-y-6">
      <div className="panel">
        <div className="eyebrow">CIVICPULSE</div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">
              Citizen Dashboard
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              View your reported incidents and track their progress.
            </p>
          </div>

          <button
            onClick={fetchIncidents}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="panel text-center py-10">
          <RefreshCw className="mx-auto animate-spin" size={24} />
          <p className="mt-3 text-sm">
            Loading your incidents...
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="panel">
          <div className="flex items-center gap-3 text-red-500">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && incidents.length === 0 && (
        <div className="panel py-10 text-center">
          <MapPin className="mx-auto mb-3 text-gray-400" size={32} />

          <h3 className="text-lg font-semibold">
            No incidents reported
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            You haven't submitted any incidents yet.
          </p>
        </div>
      )}

      {!loading && incidents.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Incident list */}
          <div className="panel">
            <h3 className="mb-4 text-lg font-semibold">
              My Reported Incidents
            </h3>

            <div className="space-y-3">
              {incidents.map((incident) => (
                <button
                  key={incident._id}
                  onClick={() =>
                    setSelectedIncident(incident._id)
                  }
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selectedIncident === incident._id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                      : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold">
                        {incident.title}
                      </h4>

                      <p className="mt-1 text-sm text-gray-500">
                        {incident.category}
                      </p>
                    </div>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs capitalize dark:bg-gray-800">
                      {statusLabel(incident.status)}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                    {incident.description}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <MapPin size={14} />

                    <span>
                      {incident.location?.address || "Location unavailable"}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-gray-400">
                    Reported:{" "}
                    {new Date(incident.createdAt).toLocaleString("en-IN")}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {}
          <div>
            {selectedIncident ? (
              <IncidentTimeline
                incidentId={selectedIncident}
              />
            ) : (
              <div className="panel">
                <p>Select an incident to view its timeline.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}