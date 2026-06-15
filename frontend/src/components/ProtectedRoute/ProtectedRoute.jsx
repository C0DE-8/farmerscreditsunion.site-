// src/components/ProtectedRoute/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return children;
}