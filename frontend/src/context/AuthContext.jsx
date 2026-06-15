import { createContext, useContext, useState } from "react";
import { loginUser, verifyLoginOtp } from "../api/authApi";

const AuthContext = createContext();

const normalizeUser = (user) => {
  if (!user) return null;

  return {
    ...user,
    role: user.is_admin ? "admin" : "user",
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? normalizeUser(JSON.parse(savedUser)) : null;
  });

  const login = async (formData) => {
    const res = await loginUser(formData);

    if (res?.token && res?.user) {
      const normalizedUser = normalizeUser(res.user);

      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      setUser(normalizedUser);
    }

    return res;
  };

  const verifyOtpLogin = async (formData) => {
    const res = await verifyLoginOtp(formData);

    if (res?.token && res?.user) {
      const normalizedUser = normalizeUser(res.user);

      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      setUser(normalizedUser);
    }

    return res;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("pendingLoginEmail");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        verifyOtpLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);