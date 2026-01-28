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
app.get('*', async (req, res) => {
  const indexPath = path.join(__dirname, '../client/dist', 'index.html');
  
  // Check if this is a game URL and inject OG tags
  const gameMatch = req.path.match(/^\/(nfl|nba)\/game\/(\d+)$/);
  
  if (gameMatch) {
    const [, league, gameId] = gameMatch;
    try {
      // Fetch game data from ESPN API
      const axios = await import('axios').then(m => m.default);
      const espnUrl = league === 'nba' 
        ? `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard`
        : `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`;
      
      const response = await axios.get(espnUrl);
      const event = response.data.events?.find((e: any) => e.id === gameId);
      
      if (event) {
        const competition = event.competitions?.[0];
        const competitors = competition?.competitors || [];
        const away = competitors.find((c: any) => c.homeAway === 'away');
        const home = competitors.find((c: any) => c.homeAway === 'home');
        
        if (away && home) {
          // Calculate time until game starts
          const now = new Date();
          const gameTime = new Date(event.date);
          const diff = gameTime.getTime() - now.getTime();
          
          let timeUntilText = '';
          if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) {
              timeUntilText = `${days}d ${hours}h`;
            } else if (hours > 0) {
              timeUntilText = `${hours}h ${minutes}m`;
            } else {
              timeUntilText = `${minutes}m`;
            }
          } else {
            const status = competition?.status?.type?.state;
            if (status === 'in') {
              timeUntilText = 'LIVE';
            } else if (status === 'post') {
              timeUntilText = 'FINAL';
            }
          }

          const title = `${away.team.abbreviation} vs ${home.team.abbreviation} - ${timeUntilText}`;
          const description = `${away.team.displayName} vs ${home.team.displayName}. Join now and manage your fantasy picks!`;
          const image = home.team.logo || `https://a.espncdn.com/media/motion/2024/1009/nfl_logo.png`;
          const url = `${process.env.HOST_URL || 'https://touchdown-882290629693.us-central1.run.app'}${req.path}`;
          
          // Read index.html and inject OG tags
          const fs = await import('fs/promises').then(m => m.default);
          let html = await fs.readFile(indexPath, 'utf-8');
          
          const ogTags = `
    <meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Touchdown" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}" />
    <meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${image}" />`;
          
          // Replace the placeholder or insert before closing head tag
          html = html.replace('</head>', `${ogTags}\n  </head>`);
          
          return res.set('Content-Type', 'text/html').send(html);
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Error fetching game data for OG tags: ${errorMsg}`);
      // Fall through to default behavior
    }
  }
  
  // Default behavior - serve index.html
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

