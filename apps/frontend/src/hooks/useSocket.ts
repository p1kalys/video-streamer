import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

import { env } from '../config/env';

const SOCKET_URL = env.VITE_SOCKET_URL;

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
    });

    socketRef.current.on('connect', () => {
      console.log('🔌 Socket connected');
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      
      // Manual reconnection for transport close
      if (reason === 'transport close') {
        setTimeout(() => {
          console.log('🔄 Attempting manual reconnection...');
          socketRef.current?.connect();
        }, 500);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const on = useCallback((event: string, callback: (data: any) => void) => {
    socketRef.current?.on(event, callback);
    return () => {
      socketRef.current?.off(event, callback);
    };
  }, []);

  return { socket: socketRef.current, on };
};
