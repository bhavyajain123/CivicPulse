
import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

type Props = {
  allowedRoles?: string[];
};

export default function ProtectedRoute({
  allowedRoles = ["admin", "operator"]
}: Props) {
  const { user } = useAuthContext();

  if (!user?.token) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
