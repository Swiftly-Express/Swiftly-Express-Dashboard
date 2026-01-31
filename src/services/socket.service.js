import { io } from "socket.io-client";
import { getCookie } from "../utils/cookies";

class SocketService {
  constructor() {
    this.socket = null;
    this.baseURL =
      import.meta.env.VITE_API_BASE_URL || "https://api.swiftlyxpress.com";
  }

  getAuthToken() {
    try {
      return (
        getCookie("customer_token") ||
        getCookie("auth_token") ||
        getCookie("rider_token") ||
        null
      );
    } catch (e) {
      return null;
    }
  }

  connect() {
    if (this.socket) return;
    console.log("[SocketService] Connecting to:", this.baseURL);
    const token = this.getAuthToken();
    if (token)
      console.log(
        "[SocketService] Using auth token for socket connection (masked):",
        String(token).slice(0, 10) + "...",
      );
    this.socket = io(this.baseURL, {
      withCredentials: true,
      // Try long-polling first so environments that block websockets still connect,
      // then upgrade to websocket when available.
      transports: ["polling", "websocket"],
      // Increase connect timeout to allow slow networks / server wakeups
      timeout: 20000,
      // Send auth token via socket.io auth payload so server can validate session on handshake
      auth: token ? { token } : undefined,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on("connect", () => {
      console.log("[SocketService] Connected. ID:", this.socket.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[SocketService] Disconnected:", reason);
    });

    this.socket.on("connect_error", (err) => {
      try {
        console.error(
          "[SocketService] Connection error:",
          err && (err.message || err),
        );
        // Provide additional debug when the websocket closed before open
        if (
          err &&
          err.message &&
          String(err.message).toLowerCase().includes("websocket is closed")
        ) {
          console.warn(
            "[SocketService] WebSocket closed before connection established — server may not support websocket or CORS may be blocking upgrades.",
          );
        }
      } catch (e) {
        console.error("[SocketService] connect_error handler failed", e);
      }
    });
  }

  /**
   * Run callback when the socket is connected (or immediately if already connected).
   * Use this before joining rooms so the server receives join events.
   * Returns a cleanup function to remove the listener.
   */
  onConnected(callback) {
    this.connect();
    if (this.socket.connected) {
      callback();
      return () => {};
    }
    const fn = () => callback();
    this.socket.once("connect", fn);
    return () => {
      if (this.socket) this.socket.off("connect", fn);
    };
  }

  /**
   * Run callback on every connect (including reconnects). Use for joining rooms
   * so that after a disconnect/reconnect we re-join and keep receiving events.
   * Returns a cleanup function to remove the listener.
   */
  onConnect(callback) {
    this.connect();
    if (this.socket.connected) callback();
    this.socket.on("connect", callback);
    return () => {
      if (this.socket) this.socket.off("connect", callback);
    };
  }

  disconnect() {
    if (this.socket) {
      console.log("[SocketService] Disconnecting...");
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event, data) {
    if (!this.socket) {
      console.warn(
        "[SocketService] Cannot emit event, socket not connected:",
        event,
      );
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
    this.emit("join:room", room);
    console.log("[SocketService] Joined room:", room);
  }

  leaveRoom(room) {
    this.emit("leave:room", room);
    console.log("[SocketService] Left room:", room);
  }

  /** Emit leave:delivery so the server removes this socket from the delivery room. */
  leaveDelivery(deliveryId) {
    this.emit("leave:delivery", { deliveryId });
    console.log("[SocketService] Left delivery room:", deliveryId);
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
