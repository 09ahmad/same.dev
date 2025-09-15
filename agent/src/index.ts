import express from "express";
import apiRouter from "./routes/api.js";
import cors from "cors";
import dotenv from "dotenv";
import { apiLimiter } from "./ratelimit_middleware.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Mount all API endpoints under /api
app.use(apiLimiter);
app.use("/api", apiRouter);
const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Unified backend running on port ${port}`);
});

