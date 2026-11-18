
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Popup,
  useMap
} from "react-leaflet";

import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

import type { Incident } from "../../services/incidentService";
import type { ResponseTeam } from "../../services/teamService";

type Props = {
  incidents: Incident[];
  teams: ResponseTeam[];
  onViewIncident?: (incident: Incident) => void;
  showOnlyDeployedTeams?: boolean;
};

const priorityColors: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e"
};

const priorityRank: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

function MapUpdater({ incidents }: { incidents: Incident[] }) {
  const map = useMap();

  useEffect(() => {
    if (incidents.length === 0) return;

    const points: [number, number][] = incidents.map(i => [
      i.location.latitude,
      i.location.longitude
    ]);

    if (points.length === 1) {
      map.setView(points[0], 13);
    } else {
      map.fitBounds(points, {
        padding: [45, 45],
        maxZoom: 12
      });
    }
  }, [incidents, map]);

  return null;
}

export default function ({
  incidents,
  teams,
  onViewIncident,
  showOnlyDeployedTeams = false
}: Props) {
  const validIncidents = incidents.filter(i => {
    const lat = i.location?.latitude;
    const lng = i.location?.longitude;

    return (
      typeof lat === "number" &&
      typeof lng === "number" &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  });

  const grouped = new Map<string, Incident[]>();

  validIncidents.forEach(incident => {
    const key =
      `${incident.location.latitude.toFixed(5)},` +
      `${incident.location.longitude.toFixed(5)}`;

    const existing = grouped.get(key) || [];
    existing.push(incident);
    grouped.set(key, existing);
  });

  const groups = Array.from(grouped.entries()).map(([key, items]) => {
    const highestPriority = items.reduce((highest, item) =>
      (priorityRank[item.priority] || 0) >
      (priorityRank[highest] || 0)
        ? item.priority
        : highest,
      "low"
    );

    return {
      key,
      items,
      latitude: items[0].location.latitude,
      longitude: items[0].location.longitude,
      color: priorityColors[highestPriority],
      densityColor:
  items.length >= 5
    ? "#ef4444"
    : items.length >= 2
    ? "#f97316"
    : "#22c55e",
    };
  });

  const center: [number, number] =
    validIncidents.length > 0
      ? [
          validIncidents[0].location.latitude,
          validIncidents[0].location.longitude
        ]
      : [28.6139, 77.209];

  return (
    <div style={{
      width: "100%",
      height: "100%",
      minHeight: "380px",
      borderRadius: "9px",
      overflow: "hidden"
    }}>
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom
        style={{
          width: "100%",
          height: "100%",
          minHeight: "380px"
        }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater incidents={validIncidents} />

        {groups.map(group => (
          <Circle
            key={`zone-${group.key}`}
            center={[group.latitude, group.longitude]}
            radius={350}
            pathOptions={{
            color: group.densityColor,
            fillColor: group.densityColor, 
              fillOpacity: 0.15,
              weight: 1
            }}
          />
        ))}

        {groups.map(group => (
          <CircleMarker
            key={group.key}
            center={[group.latitude, group.longitude]}
            radius={9 + Math.min(group.items.length, 10)}
pathOptions={{
  color: group.densityColor,
  fillColor: group.densityColor,
  fillOpacity: 1,
  weight: 2
}}
          >
            <Popup>
              <strong>
                {group.items.length} incidents at this location
              </strong>

              {group.items.map(incident => (
                <div key={incident._id} style={{ marginTop: "8px" }}>
                  <b>{incident.title}</b>
                  <br />
                  Priority: {incident.priority}
                  <br />
                  Status: {incident.status}
                  <br />
                  Address: {incident.location.address || "Address not available"}

                  <br />

<button
  type="button"
  onClick={(event) => {
    event.preventDefault();
    event.stopPropagation();
    onViewIncident?.(incident);
  }}
  style={{
    marginTop: "8px",
    padding: "7px 12px",
    border: "none",
    borderRadius: "6px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer"
  }}
>
  View Incident
</button>
                </div>
              ))}
            </Popup>
          </CircleMarker>
        ))}

      {teams
  .filter(team => {
      if (showOnlyDeployedTeams && team.isAvailable) {
    return false;
  }
    const location = team.currentLocation;

    return (
      typeof location?.latitude === "number" &&
      typeof location?.longitude === "number" &&
      Number.isFinite(location.latitude) &&
      Number.isFinite(location.longitude) &&
      location.latitude >= -90 &&
      location.latitude <= 90 &&
      location.longitude >= -180 &&
      location.longitude <= 180
    );
  })
  .map(team => {
    const location = team.currentLocation!;

    return (
      <CircleMarker
        key={`team-${team._id}`}
        center={[
          location.latitude!,
          location.longitude!
        ]}
        radius={13}
        pathOptions={{
          color: "#ffffff",
          fillColor: "#06b6d4",
          fillOpacity: 1,
          weight: 3
        }}
      >
        <Popup>
          <strong>LIVE RESPONSE TEAM</strong>
          <br />
          Team: {team.name}
          <br />
          Availability: {team.isAvailable ? "Available" : "Deployed"}
          <br />
          GPS updated:{" "}
          {location.updatedAt
            ? new Date(location.updatedAt).toLocaleString()
            : "Time unavailable"}
          <br />
          Latitude: {location.latitude}
          <br />
          Longitude: {location.longitude}
        </Popup>
      </CircleMarker>
    );
  })}
      </MapContainer>
    </div>
  );
}
