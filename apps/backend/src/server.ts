import { createServer } from 'http';
import app from './app.js';
import { config } from './config/index.js';
import { connectDB } from './config/database.js';
import { initSocket } from './socket/index.js';

const startServer = async () => {
  try {
    await connectDB();

    const httpServer = createServer(app);
    initSocket(httpServer);

    httpServer.listen(config.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${config.PORT}`);
      console.log(`📊 Health check: http://localhost:${config.PORT}/health`);
      console.log(`🔌 Socket.io ready`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
