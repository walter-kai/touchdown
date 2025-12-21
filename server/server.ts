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

// Validate required environment variable
if (!process.env.BACKEND_PORT) {
  logger.error('FATAL: BACKEND_PORT environment variable is not set');
  process.exit(1);
}

const app = express();
const port = process.env.BACKEND_PORT;

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

// Serve React application static files
app.use(express.static(path.join(__dirname, '../client/dist')));

// Catch-all for React Router - MUST be last
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../client/dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('index.html not found. Please build the client app.');
    }
  });
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

