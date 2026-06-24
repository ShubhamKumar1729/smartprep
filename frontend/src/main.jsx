import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { Toaster } from "react-hot-toast";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: "12px",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "13px",
          fontWeight: "500",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        },
        success: {
          style: {
            background: "#f0fdf4",
            color: "#166534",
            border: "1px solid #bbf7d0",
          },
        },
        error: {
          style: {
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca",
          },
        },
        loading: {
          style: {
            background: "#f8fafc",
            color: "#374151",
            border: "1px solid #e2e8f0",
          },
        },
      }}
    />
  </React.StrictMode>
);