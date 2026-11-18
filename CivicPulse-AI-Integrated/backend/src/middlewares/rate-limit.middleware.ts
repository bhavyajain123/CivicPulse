import rateLimit from "express-rate-limit";

const isProduction = process.env.NODE_ENV === "production";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProduction ? 100 : 1000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later"
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: isProduction ? 10 : 100,

  standardHeaders: "draft-7",
  legacyHeaders: false,


  skipSuccessfulRequests: true,

  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes"
  }
});