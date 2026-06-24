import React from "react";

const sizes = { sm: 16, md: 32, lg: 48, xl: 64 };

const LoadingSpinner = ({ size = "md", color = "primary" }) => {
  const px = sizes[size] || 32;
  const borderColor =
    color === "white"
      ? "rgba(255,255,255,0.25)"
      : color === "indigo"
      ? "rgba(99,102,241,0.2)"
      : "#e2e8f0";
  const topColor =
    color === "white" ? "white" : color === "indigo" ? "#6366f1" : "#6366f1";

  return (
    <div
      style={{
        width: px,
        height: px,
        border: `2.5px solid ${borderColor}`,
        borderTop: `2.5px solid ${topColor}`,
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
        display: "inline-block",
        flexShrink: 0,
      }}
      role="status"
      aria-label="Loading"
    />
  );
};

export default LoadingSpinner;