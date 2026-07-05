import { useContext } from "react";
import { SocketContext } from "../context/SocketContext.jsx";

// Hook to access the shared socket instance.
export const useSocket = () => {
    const socket = useContext(SocketContext);

    if (socket === undefined) {
        throw new Error("useSocket must be used within a SocketProvider");
    }   
    
    return socket || { socket: null, connected: false };
}