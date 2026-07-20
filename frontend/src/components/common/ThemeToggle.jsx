import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext.jsx";

const ThemeToggle = ({ size = "md" }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const sizes = {
    sm: { width: 44, height: 24, knob: 18 },
    md: { width: 52, height: 28, knob: 22 },
    lg: { width: 60, height: 32, knob: 26 },
  };

  const { width, height, knob } = sizes[size] || sizes.md;

  return (
    <motion.button
      onClick={toggleTheme}
      whileTap={{ scale: 0.95 }}
      style={{
        width,
        height,
        borderRadius: 999,
        border: "none",
        backgroundColor: isDark ? "#818cf8" : "#e2e8f0",
        cursor: "pointer",
        position: "relative",
        padding: 2,
        display: "flex",
        alignItems: "center",
        transition: "background-color 0.3s ease",
        fontFamily: "inherit",
      }}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <motion.div
        animate={{ x: isDark ? width - knob - 4 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{
          width: knob,
          height: knob,
          borderRadius: "50%",
          backgroundColor: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: knob * 0.55,
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        }}
      >
        {isDark ? "🌙" : "☀️"}
      </motion.div>
    </motion.button>
  );
};

export default ThemeToggle;