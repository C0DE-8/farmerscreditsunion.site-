// src/components/PublicRoute/PublicRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function PublicRoute({ children }) {
  const { user } = useAuth();
  const token = localStorage.getItem("token");

  if (token && user) {
    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return children;
}