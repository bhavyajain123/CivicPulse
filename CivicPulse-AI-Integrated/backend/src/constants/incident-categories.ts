export const INCIDENT_CATEGORIES=[
    "fire",
    "accident",
    "medical",
    "crime",
    "other"
]as const;

export type IncidentCategory=(typeof INCIDENT_CATEGORIES)[number];
export const INCIDENT_CATEGORY_LABELS: Record<
  IncidentCategory,
  string
> = {
  fire: "Fire Emergency",
  accident: "Road Accident",
  medical: "Medical Emergency",
  crime: "Crime or Security",
  other: "Other Emergency"
};