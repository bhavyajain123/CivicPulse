import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";

import { socketService, type CivicSocket } from "../services/socketService";
import { useAuthContext } from "./AuthContext";

interface SocketContextValue {
  socket: CivicSocket | null;
  connected: boolean;
  connectionError: string;
  reconnect: () => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(
  undefined
);

export const SocketProvider = ({
  children
}: {
  children: ReactNode;
}) => {
  const { user } = useAuthContext();

  const [socket, setSocket] = useState<CivicSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState("");

  const token = user?.token;

  useEffect(() => {
    if (!token) {
      socketService.disconnect();
      setSocket(null);
      setConnected(false);
      setConnectionError("");
      return;
    }

    const currentSocket = socketService.connect(token);

    const handleConnect = () => {
      setConnected(true);
      setConnectionError("");
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    const handleConnectError = (error: Error) => {
      setConnected(false);
      setConnectionError(error.message);
    };

    setSocket(currentSocket);
    setConnected(currentSocket.connected);

    currentSocket.on("connect", handleConnect);
    currentSocket.on("disconnect", handleDisconnect);
    currentSocket.on("connect_error", handleConnectError);

    return () => {
      currentSocket.off("connect", handleConnect);
      currentSocket.off("disconnect", handleDisconnect);
      currentSocket.off("connect_error", handleConnectError);
    };
  }, [token]);

  const reconnect = useCallback(() => {
    if (!token) return;

    socketService.disconnect();

    const newSocket = socketService.connect(token);

    setSocket(newSocket);
    setConnected(newSocket.connected);
    setConnectionError("");
  }, [token]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        connectionError,
        reconnect
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextValue => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error(
      "useSocket must be used inside SocketProvider"
    );
  }

  return context;
};