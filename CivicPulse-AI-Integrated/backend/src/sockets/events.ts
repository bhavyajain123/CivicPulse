export const EVENTS = {

  JOIN_INCIDENT: "join-incident",
  LEAVE_INCIDENT: "leave-incident",
  INCIDENT_JOINED: "incident-joined",
  INCIDENT_UPDATED: "incident-updated",
  INCIDENT_ACCESS_REVOKED: "incident-access-revoked",

  UPDATE_TEAM_LOCATION: "update-team-location",
  TEAM_LOCATION_SAVED: "team-location-saved",
  TEAM_LOCATION_UPDATED: "team-location-updated",

  
  NEW_NOTIFICATION: "new-notification",

  
  JOIN_COMPLAINT: "complaint:join",
  LEAVE_COMPLAINT: "complaint:leave",
  COMPLAINT_UPDATED: "complaint:updated",
  COMPLAINT_STATUS_CHANGED: "complaint:status-changed",
  TEAM_ASSIGNED: "dispatch:team-assigned",


  TRACKING_START: "tracking:start",
  TRACKING_LOCATION: "tracking:location",
  TRACKING_STOP: "tracking:stop",
  TRACKING_UPDATED: "tracking:updated",

  PRESENCE_UPDATE: "presence:update",
  PRESENCE_GET: "presence:get",

 
  PING: "system:ping",
  PONG: "system:pong",


  SOCKET_ERROR: "socket-error"
} as const;