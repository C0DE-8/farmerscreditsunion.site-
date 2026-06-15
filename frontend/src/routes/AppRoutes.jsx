import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Admin from "../pages/Admin/Admin";
import VerifyLoginOTP from "../pages/VerifyLoginOTP/VerifyLoginOTP";
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";
import PublicRoute from "../components/PublicRoute/PublicRoute";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/verify-login-otp"
          element={
            <PublicRoute>
              <VerifyLoginOTP />
            </PublicRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}