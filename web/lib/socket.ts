"use client";

import { io } from "socket.io-client";

// Use environment variable or default to localhost:3000
const URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const socket = io(URL + "/booking", {
    autoConnect: false,
    transports: ["websocket"],
});
