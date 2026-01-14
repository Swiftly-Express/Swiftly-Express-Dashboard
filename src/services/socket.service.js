import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://api.swiftlyxpress.com';
  }

  connect() {
    if (this.socket) return;

    console.log('[SocketService] Connecting to:', this.baseURL);
    this.socket = io(this.baseURL, {
      withCredentials: true,
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[SocketService] Connected. ID:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketService] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[SocketService] Connection error:', err.message);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('[SocketService] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event, data) {
    if (!this.socket) {
      console.warn('[SocketService] Cannot emit event, socket not connected:', event);
      return;
    }
    this.socket.emit(event, data);
  }

  on(event, callback) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  off(event, callback) {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }

  joinRoom(room) {
    this.emit('join:room', room);
    console.log('[SocketService] Joined room:', room);
  }

  leaveRoom(room) {
    this.emit('leave:room', room);
    console.log('[SocketService] Left room:', room);
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
