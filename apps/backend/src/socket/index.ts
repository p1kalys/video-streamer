import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

let io: SocketServer;

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// Event queue to store missed events per user
interface QueuedEvent {
  event: string;
  data: any;
  timestamp: number;
}

const eventQueue = new Map<string, QueuedEvent[]>();

export const initSocket = (httpServer: HttpServer) => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 120000,  // 2 minutes - increased for large uploads
    pingInterval: 25000,
    connectTimeout: 45000,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e8,
  });

  // JWT authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token as string, config.JWT_SECRET) as JwtPayload;
      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user.userId;
    const room = `user_${userId}`;
    const transport = socket.conn.transport.name;
    
    console.log(`✅ User connected: ${userId} (Socket: ${socket.id}, Transport: ${transport})`);

    // Join user to their personal room
    socket.join(room);
    
    // Confirm room join
    const socketsInRoom = io.sockets.adapter.rooms.get(room);
    console.log(`🚪 User ${userId} joined room '${room}'. Clients in room: ${socketsInRoom?.size || 0}`);

    // Deliver any queued events immediately on reconnection
    const queuedEvents = eventQueue.get(userId);
    if (queuedEvents && queuedEvents.length > 0) {
      console.log(`📬 Delivering ${queuedEvents.length} queued events to user ${userId}`);
      queuedEvents.forEach(({ event, data }) => {
        socket.emit(event, data);
      });
      eventQueue.delete(userId); // Clear queue after delivery
    }

    // Monitor transport upgrades
    socket.conn.on('upgrade', (transport) => {
      console.log(`🔄 Transport upgraded to: ${transport.name} for user ${userId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`❌ User disconnected: ${userId} (Reason: ${reason}, Socket: ${socket.id})`);
    });

    socket.on('error', (error) => {
      console.error(`🔥 Socket error for user ${userId}:`, error);
    });
    
    // Handle ping/pong for connection testing
    socket.on('ping', () => {
      socket.emit('pong');
      console.log(`💓 Ping received from user ${userId}, sent pong`);
    });
    
    // Send a test event to confirm connection
    socket.emit('connected', { 
      userId, 
      socketId: socket.id,
      transport: transport,
      message: 'Successfully connected to Socket.io server' 
    });
  });

  return io;
};

export const getIO = (): SocketServer => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (!io) {
    console.error('Socket.io not initialized');
    return;
  }
  const room = `user_${userId}`;
  const socketsInRoom = io.sockets.adapter.rooms.get(room);
  const clientCount = socketsInRoom ? socketsInRoom.size : 0;
  
  if (clientCount > 0) {
    // Socket is connected, emit immediately
    io.to(room).emit(event, data);
    console.log(`📡 Emitted ${event} to user ${userId} (${clientCount} clients in room)`);
  } else {
    // No socket connected, queue the event for delivery on reconnection
    if (!eventQueue.has(userId)) {
      eventQueue.set(userId, []);
    }
    eventQueue.get(userId)!.push({ event, data, timestamp: Date.now() });
    const queueSize = eventQueue.get(userId)!.length;
    console.log(`📦 Queued ${event} for user ${userId} (no active connection, queue size: ${queueSize})`);
  }
};
