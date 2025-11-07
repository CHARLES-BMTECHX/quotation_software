import axios from 'axios';

const API = axios.create({
  baseURL: `${import.meta.env.VITE_BASE_URI}/user`,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const sendOTP = (email) => API.post('/send-otp', email);
export const verifyOTP = (data) => API.post('/verify-otp', data);
export const resetPassword = (data) => API.post('/reset-password', data, {
  headers: { Authorization: `Bearer ${localStorage.getItem('resetToken')}` }
});
export const loginUser = (data) => API.post('/login', data);
// User APIs
export const registerUser = (data) => API.post("/register", data);
// export const loginUser = (data) => API.post("/login", data);
export const forgotPassword = (data) => API.post("/forgot-password", data);
export const getUsers = () => API.get("/");
export const updateUser = (id, data) => API.put(`/${id}`, data);
export const deleteUser = (id) => API.delete(`/${id}`);