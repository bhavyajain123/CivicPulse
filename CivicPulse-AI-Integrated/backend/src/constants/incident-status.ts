export const INCIDENT_STATUSES=[
    "pending",
    "verified",
    "assigned",
    "resolved"
]as const;

export type IncidentStatus=(typeof INCIDENT_STATUSES)[number];

export const INCIDENT_STATUS_LABELS: Record<
  IncidentStatus,
  string
> = {
  pending: "Pending",
  verified: "Verified",
  assigned: "Assigned to Response Team",
  resolved: "Resolved"
};