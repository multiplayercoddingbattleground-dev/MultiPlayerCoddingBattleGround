import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// autoConnect is off — pages that need realtime updates (the battle room)
// call socket.connect() on mount and socket.disconnect() on unmount.
const socket = io(SOCKET_URL, { autoConnect: false });

export default socket;
