// /src/api/axios.js
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const url = config.url || "";
  const token = url.startsWith("/admin")
    ? localStorage.getItem("adminToken")
    : url.startsWith("/user")
      ? localStorage.getItem("userToken")
      : localStorage.getItem("userToken") || localStorage.getItem("adminToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
