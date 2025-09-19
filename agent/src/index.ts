import express from "express";
import apiRouter from "./routes/api";
import cors from "cors";
import dotenv from "dotenv";
import { apiLimiter } from "./ratelimit_middleware";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(apiLimiter);
app.use("/api", apiRouter);
const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(` Backend running on port ${port}`);
});

