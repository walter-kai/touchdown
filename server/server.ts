// Load environment variables FIRST before any other imports
import { config } from 'dotenv';
import path from 'path';
config({ path: path.join(__dirname, '..', '.env') });

import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { Server as WebSocketServer } from 'ws'; // WebSocket library
// import subgraph from './routes/subgraph/service'; // Import getPairs function
import routes from './routes';


const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(morgan('combined')); // Logs HTTP requests
app.use(cors());
app.use(express.json());
// app.use(express.static(path.join(__dirname, '../client/build')));
app.use("/api", routes);


// 404 handler for API routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: "API route not found" });
});

app.post('/', (req: Request, res: Response) => {
  res.redirect('/');
});

// Serve React application  
app.use(express.static(path.join(__dirname, '../client/dist')));
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
  console.log(`Server is running on http://localhost:${port}`);
});

