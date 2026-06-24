import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import testService from "../services/testService.js";
import useToast from "../hooks/useToast.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import { formatDate, formatDuration } from "../utils/formatters.js";

const difficultyConfig = {
  easy: { color: "#16a34a", bg: "#f0fdf4" },
  medium: { color: "#d97706", bg: "#fffbeb" },
  hard: { color: "#dc2626", bg: "#fef2f2" },
  mixed: { color: "#6366f1", bg: "#eef2ff" },
};

const TestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testService
      .getById(id)
      .then((res) => setTest(res.data.test))
      .catch(() => {
        toastError("Test not found");
        navigate("/my-tests");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleStart = () => {
    navigate(`/exam/environment-check/${id}`);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const dc = difficultyConfig[test?.difficulty] || difficultyConfig.mixed;

  return (
    <div
      style={{
        maxWidth: 680,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* Back */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <button
          onClick={() => navigate("/my-tests")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#6366f1",
            fontSize: 13,
            fontWeight: 600,
            padding: 0,
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 12,
          }}
        >
          ← Back to Tests
        </button>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.02em",
          }}
        >
          {test?.title}
        </h1>
      </motion.div>

      {/* Test Overview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <h3
          style={{
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 16,
            fontSize: 15,
          }}
        >
          Test Overview
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 10,
          }}
        >
          {[
            { label: "Questions", value: test?.questionCount, emoji: "❓" },
            { label: "Duration", value: formatDuration(test?.duration), emoji: "⏱️" },
            {
              label: "Difficulty",
              value: test?.difficulty,
              emoji: "📊",
              capitalize: true,
            },
            {
              label: "Type",
              value: test?.testType,
              emoji: "📋",
              capitalize: true,
            },
            { label: "Attempts", value: test?.attemptCount || 0, emoji: "🔄" },
            { label: "Created", value: formatDate(test?.createdAt), emoji: "📅" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  marginBottom: 4,
                }}
              >
                {item.emoji} {item.label}
              </p>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0f172a",
                  textTransform: item.capitalize ? "capitalize" : "none",
                }}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Proctoring Notice */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{
          backgroundColor: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: 16,
          padding: "1.25rem",
          display: "flex",
          gap: 14,
          alignItems: "flex-start",
        }}
      >
        <span style={{ fontSize: 26, flexShrink: 0 }}>🛡️</span>
        <div>
          <p
            style={{
              fontWeight: 700,
              color: "#92400e",
              fontSize: 15,
              marginBottom: 4,
            }}
          >
            This exam is AI-proctored
          </p>
          <p style={{ color: "#78350f", fontSize: 13, lineHeight: 1.7 }}>
            Before starting, you will go through an environment
            verification — camera, microphone, and face detection. The
            exam runs in mandatory fullscreen mode with continuous
            monitoring.
          </p>
        </div>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <h3
          style={{
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 16,
            fontSize: 15,
          }}
        >
          📋 Before You Start
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            `This test has ${test?.questionCount} questions`,
            `Total duration is ${formatDuration(test?.duration)}`,
            "You must complete environment verification first",
            "Camera and microphone access is required",
            "Sit in a well-lit room, look at the camera",
            "Only you should be visible in the camera",
            "Exam runs in mandatory fullscreen mode",
            "Do not switch tabs or minimize the window",
            "All suspicious activity is recorded",
            "Test auto-submits when time expires",
          ].map((instruction, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  backgroundColor: "#eef2ff",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#4338ca",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                {instruction}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Start Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleStart}
        className="btn-primary"
        style={{ width: "100%", padding: "1rem", fontSize: 16 }}
      >
        🚀 Proceed to Environment Check
      </motion.button>
    </div>
  );
};

export default TestDetail;