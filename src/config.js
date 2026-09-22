// Centralized API URL Configuration
export const API_URL =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "")
    ? "http://localhost:5001"
    : "https://agridirectai-backend.onrender.com";
