import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketState {
    socket: Socket | null;
    isConnected: boolean;
    connect: () => void;
    disconnect: () => void;
}

const URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const useSocketStore = create<SocketState>((set, get) => ({
    socket: null,
    isConnected: false,
    connect: () => {
        const { socket } = get();

        // If socket exists, ensure it's connected
        if (socket) {
            if (!socket.connected) {
                socket.connect();
            }
            return;
        }

        const newSocket = io(URL + "/booking", {
            autoConnect: false,
            transports: ["websocket"], // Enforce WebSocket only
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            set({ isConnected: true });
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            set({ isConnected: false });
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        newSocket.connect();
        set({ socket: newSocket });
    },
    disconnect: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null, isConnected: false });
        }
    },
}));
