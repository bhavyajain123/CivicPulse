import { useEffect, useState } from "react";
import {
  Circle,
  Clock,
  Loader2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Users,
  Activity,
  CheckCheck
} from "lucide-react";

import { incidentService } from "../../services/incidentService";
import { socketService } from "../../services/socketService";

type IncidentStatus =
  | "pending"
  | "verified"
  | "assigned"
  | "in_progress"
  | "resolved";

type TimelineEntry = {
  status: IncidentStatus;
  message: string;
  updatedBy?: string | null;
  timestamp: string;
};

type IncidentTimelineProps = {
  incidentId: string;
};

const statusConfig: Record<
  IncidentStatus,
  {
    label: string;
    icon: typeof FileText;
  }
> = {
  pending: {
    label: "Reported",
    icon: FileText
  },
  verified: {
    label: "Verified",
    icon: ShieldCheck
  },
  assigned: {
    label: "Team Assigned",
    icon: Users
  },
  in_progress: {
    label: "In Progress",
    icon: Activity
  },
  resolved: {
    label: "Resolved",
    icon: CheckCheck
  }
};

const formatDate = (date: string) => {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
};

const IncidentTimeline = ({ incidentId }: IncidentTimelineProps) => {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchTimeline = async (showLoader = false) => {
      if (showLoader && isMounted) {
        setLoading(true);
      }

      if (isMounted) {
        setError("");
      }

      try {
        const response = await incidentService.getTimeline(incidentId);

        if (isMounted) {
          setTimeline(response.timeline ?? []);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load incident timeline"
          );
        }
      } finally {
        if (isMounted && showLoader) {
          setLoading(false);
        } else if (isMounted) {
          setLoading(false);
        }
      }
    };

    const socket = socketService.getSocket();

    const handleIncidentUpdated = (payload: {
      incidentId: string;
      updatedAt: string;
    }) => {
      if (payload.incidentId === incidentId) {
        fetchTimeline();
      }
    };

    const handleAccessRevoked = (payload: {
      incidentId: string;
      reason: string;
    }) => {
      if (payload.incidentId === incidentId) {
        setError(payload.reason || "Access to this incident was revoked.");
        setTimeline([]);
      }
    };

    const joinIncident = () => {
      socket?.emit("join-incident", incidentId);
    };

    fetchTimeline(true);

    if (socket) {
      socket.on("incident-updated", handleIncidentUpdated);
      socket.on("incident-access-revoked", handleAccessRevoked);
      socket.on("connect", joinIncident);

      if (socket.connected) {
        joinIncident();
      }
    }

    return () => {
      isMounted = false;

      if (socket) {
        socket.off("incident-updated", handleIncidentUpdated);
        socket.off("incident-access-revoked", handleAccessRevoked);
        socket.off("connect", joinIncident);

        if (socket.connected) {
          socket.emit("leave-incident", incidentId);
        }
      }
    };
  }, [incidentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-12">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        <p className="text-sm text-gray-500">
          Loading incident timeline...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
        <Clock className="mx-auto mb-3 h-8 w-8 text-gray-400" />
        <p className="text-sm text-gray-500">
          No timeline updates available yet.
        </p>
      </div>
    );
  }

  const sortedTimeline = [...timeline].sort(
    (a, b) =>
      new Date(a.timestamp).getTime() -
      new Date(b.timestamp).getTime()
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Incident Progress
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Track the progress of your reported incident.
        </p>
      </div>

      <div className="relative">
        {sortedTimeline.map((entry, index) => {
          const config = statusConfig[entry.status];
          const Icon = config?.icon ?? Circle;
          const isLast = index === sortedTimeline.length - 1;

          return (
            <div
              key={`${entry.status}-${entry.timestamp}-${index}`}
              className="relative flex gap-4 pb-8 last:pb-0"
            >
              {!isLast && (
                <div className="absolute left-[17px] top-10 h-full w-px bg-gray-200 dark:bg-gray-700" />
              )}

              <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {config?.label ?? entry.status.replace(/_/g, " ")}
                  </h3>

                  {isLast && (
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      Latest Update
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  {entry.message}
                </p>

                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(entry.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IncidentTimeline;