import { useSocket } from "../../context/SocketContext";
import "../../styles/socket-status.css";

export default function SocketConnectionBadge() {
  const { connected, connectionError, reconnect } = useSocket();

  return (
    <div
      className={`socket-status ${
        connected ? "socket-status--connected" : "socket-status--disconnected"
      }`}
      role="status"
      aria-live="polite"
    >
      <span className="socket-status__dot" />

      <span>
        {connected ? "LIVE CONNECTED" : "DISCONNECTED"}
      </span>

      {!connected && (
        <button
          type="button"
          className="socket-status__button"
          onClick={reconnect}
        >
          Reconnect
        </button>
      )}

      {connectionError && (
        <span className="socket-status__error">
          {connectionError}
        </span>
      )}
    </div>
  );
}