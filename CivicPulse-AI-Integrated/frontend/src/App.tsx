
import AppRoutes from "./routes/AppRoutes";
import { SocketProvider } from "./context/SocketContext";

export default function App() {
  return (
    <SocketProvider>
      <AppRoutes />
    </SocketProvider>
  );
}

