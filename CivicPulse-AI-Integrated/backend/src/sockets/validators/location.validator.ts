import type { IncidentLocationPayload } from "../types";

export function isValidLocation(
  value: unknown
): value is IncidentLocationPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;

  if (
    typeof payload.incidentId !== "string" ||
    payload.incidentId.trim().length === 0
  ) {
    return false;
  }

  if (
    typeof payload.latitude !== "number" ||
    !Number.isFinite(payload.latitude) ||
    payload.latitude < -90 ||
    payload.latitude > 90
  ) {
    return false;
  }

  if (
    typeof payload.longitude !== "number" ||
    !Number.isFinite(payload.longitude) ||
    payload.longitude < -180 ||
    payload.longitude > 180
  ) {
    return false;
  }

  if (
    payload.accuracy !== undefined &&
    (
      typeof payload.accuracy !== "number" ||
      !Number.isFinite(payload.accuracy) ||
      payload.accuracy < 0
    )
  ) {
    return false;
  }

  if (
    payload.heading !== undefined &&
    (
      typeof payload.heading !== "number" ||
      !Number.isFinite(payload.heading) ||
      payload.heading < 0 ||
      payload.heading > 360
    )
  ) {
    return false;
  }

  if (
    payload.speed !== undefined &&
    (
      typeof payload.speed !== "number" ||
      !Number.isFinite(payload.speed) ||
      payload.speed < 0
    )
  ) {
    return false;
  }

  return true;
}