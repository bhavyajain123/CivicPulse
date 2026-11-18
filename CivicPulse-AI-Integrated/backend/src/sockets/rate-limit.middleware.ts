import type { Socket } from "socket.io";

interface RateLimitConfig {
  windowMs: number;
  maxEvents: number;
}

interface RateLimitRecord {
  windowStart: number;
  count: number;
}

const DEFAULT_LIMIT: RateLimitConfig = {
  windowMs: 10_000,
  maxEvents: 100
};

const EVENT_LIMITS: Record<string, RateLimitConfig> = {
  "update-team-location": {
    windowMs: 60_000,
    maxEvents: 30
  },

  "tracking:location": {
    windowMs: 60_000,
    maxEvents: 30
  },

  "join-incident": {
    windowMs: 10_000,
    maxEvents: 15
  },

  "complaint:join": {
    windowMs: 10_000,
    maxEvents: 15
  },

  "presence:get": {
    windowMs: 10_000,
    maxEvents: 10
  }
};

export const attachSocketRateLimiter = (
  socket: Socket
): void => {
  const eventRecords = new Map<string, RateLimitRecord>();
  socket.use((packet, next) => {
    const eventName = packet[0];

    if (typeof eventName !== "string") {
      return next();
    }
    const config =
      EVENT_LIMITS[eventName] ?? DEFAULT_LIMIT;
    const now = Date.now();
    const record = eventRecords.get(eventName);

    if (!record || now - record.windowStart >= config.windowMs) {
      eventRecords.set(eventName, {
        windowStart: now,
        count: 1
      });
      return next();
    }

    if (record.count >= config.maxEvents) {
      socket.emit("socket-error", {
        code: "RATE_LIMITED",
        message: `Too many ${eventName} events. Please slow down.`
      });

      return next(
        new Error("Socket event rate limit exceeded")
      );
    }

    record.count += 1;
    return next();
  });

  socket.on("disconnect", () => {
    eventRecords.clear();
  });
};