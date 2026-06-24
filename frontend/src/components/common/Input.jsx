import React from "react";

const Input = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  required,
  disabled,
  className = "",
  hint,
  ...props
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label
          htmlFor={name}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#374151",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {label}
          {required && (
            <span style={{ color: "#ef4444", fontSize: 14 }}>*</span>
          )}
        </label>
      )}

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`form-input ${error ? "form-input-error" : ""} ${className}`}
        {...props}
      />

      {hint && !error && (
        <p style={{ fontSize: 12, color: "#94a3b8" }}>{hint}</p>
      )}

      {error && (
        <p
          style={{
            color: "#ef4444",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
};

export default Input;