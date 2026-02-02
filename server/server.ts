// Load environment variables FIRST before any other imports
import { config } from 'dotenv';
import path from 'path';
config({ path: path.join(__dirname, '..', '.env') });

import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { Server as WebSocketServer } from 'ws'; // WebSocket library
// import subgraph from './routes/subgraph/service'; // Import getPairs function
// Initialize Firebase Admin SDK once
import './utils/firebase';
import routes from './api';
import authRoute from './auth/auth.route';
import logger from './utils/logger';

// Backend API port (Next.js handles public PORT)
const port = process.env.BACKEND_PORT || '3001';

const app = express();

// Middleware
app.use(morgan('combined')); // Logs HTTP requests
app.use(cors());
app.use(express.json());

// API and Auth routes MUST come before static files
app.use("/api", routes);

// Mount auth routes directly at /auth for OAuth callbacks
app.use("/auth", authRoute);

// Add test route to verify auth is mounted
app.get('/auth-test', (req, res) => {
  res.json({ message: 'Auth routes are mounted correctly' });
});

// 404 handler for API routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: "API route not found" });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: express.NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err?.statusCode || 500;
  const message = err?.message || 'Internal server error';

  logger.error(err);
  return res.status(statusCode).json({ ok: false, error: message });
});

// Start HTTP server
const server = app.listen(port, () => {
  logger.info(`=== SERVER STARTED ===`);
  logger.info(`Server is running on http://localhost:${port}`);
  logger.info(`PORT: ${port}`);
  logger.info(`NODE_ENV: ${process.env.NODE_ENV}`);
  logger.info(`HOST_URL: ${process.env.HOST_URL}`);
  logger.info(`======================`);
});

