// src/api/authApi.js
import axiosInstance from "./axios";

export const loginUser = async (payload) => {
  const response = await axiosInstance.post("/auth/login", payload);
  return response.data;
};

export const registerUser = async (payload) => {
  const response = await axiosInstance.post("/auth/register", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const verifyLoginOtp = async (payload) => {
  const response = await axiosInstance.post("/auth/login/verify-otp", payload);
  return response.data;
};
