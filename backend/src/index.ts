import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { SocketController } from './controllers/SocketController';
import { PORT } from './config';
import dotenv from "dotenv";
dotenv.config();

const allowedOrigins: string[] = [
  process.env.URL1!,
  process.env.URL2!
]

const startServer = () => {

  const app = express();

  const server = http.createServer(app);

  
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins, 
      methods: ["GET", "POST"]
    }
  });

  app.get('/', (req, res) => {
    res.send('4 in a Row Backend Server is running! Check Socket.IO connection for real-time play.');
  });

  
  new SocketController(io);


  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.IO listening on port ${PORT}`);
  });
};

startServer();