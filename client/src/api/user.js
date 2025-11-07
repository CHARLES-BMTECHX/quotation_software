import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_BASE_URI}/user`,
});

// User APIs
export const registerUser = (data) => API.post("/register", data);
export const loginUser = (data) => API.post("/login", data);
export const forgotPassword = (data) => API.post("/forgot-password", data);
export const getUsers = () => API.get("/");
export const updateUser = (id, data) => API.put(`/${id}`, data);
export const deleteUser = (id) => API.delete(`/${id}`);
