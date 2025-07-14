
import express from 'express';
import apiRouter from './routes/api.js';
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Mount all API endpoints under /api
app.use('/api', apiRouter);

app.listen(3000, () => {
  console.log('Unified backend running on port 3000');
});