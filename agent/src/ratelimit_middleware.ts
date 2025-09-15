import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 300 * 60 * 1000,
  max: 100,
  message:
    "Token limited exceeded try after after 5 hours, After the token refresh",
  standardHeaders: true,
  legacyHeaders: false,
});
