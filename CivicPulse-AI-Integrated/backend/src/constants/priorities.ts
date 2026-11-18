export const INCIDENT_PRIORTIES=[
    "low",
    "medium",
    "high",
    "critical"
]as const;

export type IncidentPriority=(typeof INCIDENT_PRIORTIES)[number];

export const INCIDENT_PRIORTIES_LABELS: Record<
IncidentPriority, string
>={
low:"Low",
medium:"Medium",
high:"High",
critical:"Critical"
};