import React from "react";
import LoadingSpinner from "./LoadingSpinner.jsx";

const variants = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

const Button = ({
  children,
  variant = "primary",
  loading = false,
  disabled = false,
  onClick,
  type = "button",
  fullWidth = false,
  size = "md",
  style = {},
  className = "",
  ...props
}) => {
  const sizeStyles = {
    sm: { padding: "0.5rem 1rem", fontSize: "0.8rem" },
    md: {},
    lg: { padding: "0.875rem 2rem", fontSize: "1rem" },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${variants[variant]} ${className}`}
      style={{
        width: fullWidth ? "100%" : "auto",
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" color="white" />}
      {children}
    </button>
  );
};

export default Button;