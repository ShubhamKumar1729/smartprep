import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import proctoringService from "../services/proctoringService.js";
import useToast from "../hooks/useToast.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import { formatDateTime } from "../utils/formatters.js";

const eventEmojis = {
  proctoring_started: "▶️",
  proctoring_ended: "⏹️",
  face_present: "👤",
  face_missing: "🙈",
  multiple_faces: "👥",
  tab_switch: "🧭",
  window_blur: "🪟",
  fullscreen_exit: "🖥️",
  page_reload: "🔄",
  camera_started: "📷",
  camera_stopped: "📷",
  microphone_started: "🎤",
  excessive_audio: "🔊",
  voice_activity: "🎙️",
  silence_detected: "🔇",
  screenshot_captured: "📸",
  face_detection_unavailable: "⚠️",
  camera_permission_denied: "🚫",
  microphone_permission_denied: "🚫",
};

const severityConfig = {
  info: { color: "#6366f1", bg: "#eef2ff", label: "Info" },
  low: { color: "#16a34a", bg: "#f0fdf4", label: "Low" },
  medium: { color: "#d97706", bg: "#fffbeb", label: "Medium" },
  high: { color: "#dc2626", bg: "#fef2f2", label: "High" },
};

const riskConfig = {
  low: { color: "#16a34a", bg: "#f0fdf4", label: "Low Risk" },
  medium: { color: "#d97706", bg: "#fffbeb", label: "Medium Risk" },
  high: { color: "#dc2626", bg: "#fef2f2", label: "High Risk" },
};

const ProctoringReport = () => {
  const { attemptId } = useParams();
  const { error: toastError } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    proctoringService
      .report(attemptId)
      .then((res) => setData(res.data))
      .catch(() => toastError("Failed to load proctoring report"))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const risk = data?.risk;
  const events = data?.events || [];
  const summary = data?.summary || {};
  const rc = riskConfig[risk?.riskLevel] || riskConfig.low;

  const filteredEvents = events.filter((e) => {
    if (filter === "all") return true;
    if (filter === "violations")
      return ["face_missing", "multiple_faces", "tab_switch",
               "window_blur", "fullscreen_exit", "page_reload",
               "excessive_audio"].includes(e.eventType);
    return e.severity === filter;
  });

  const violationCount = events.filter((e) =>
    ["face_missing", "multiple_faces", "tab_switch",
     "window_blur", "fullscreen_exit", "page_reload"].includes(e.eventType)
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link
          to={`/result/${attemptId}`}
          style={{
            color: "#6366f1",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 12,
          }}
        >
          ← Back to Result
        </Link>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.02em",
          }}
        >
          🛡️ Proctoring Report
        </h1>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
          {data?.attempt?.testId?.title || "Exam"} — Monitoring Report
        </p>
      </motion.div>

      {/* Risk Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          background: `linear-gradient(135deg, ${rc.bg}, white)`,
          border: `1.5px solid ${rc.color}30`,
          borderRadius: 20,
          padding: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: `4px solid ${rc.color}`,
            backgroundColor: "white",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: `0 4px 16px ${rc.color}20`,
          }}
        >
          <span
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: rc.color,
              lineHeight: 1,
            }}
          >
            {risk?.riskScore || 0}
          </span>
          <span style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>
            pts
          </span>
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
            Overall Risk Assessment
          </p>
          <p
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: rc.color,
              letterSpacing: "-0.01em",
            }}
          >
            {rc.label}
          </p>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            {violationCount} violation
            {violationCount !== 1 ? "s" : ""} recorded ·{" "}
            {events.length} total events
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontSize: 13,
          }}
        >
          {risk?.riskLevel === "low" && (
            <p
              style={{
                color: "#16a34a",
                fontWeight: 600,
                backgroundColor: "#f0fdf4",
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid #bbf7d0",
              }}
            >
              ✅ Exam Integrity Maintained
            </p>
          )}
          {risk?.riskLevel === "medium" && (
            <p
              style={{
                color: "#d97706",
                fontWeight: 600,
                backgroundColor: "#fffbeb",
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid #fde68a",
              }}
            >
              ⚠️ Minor Violations Detected
            </p>
          )}
          {risk?.riskLevel === "high" && (
            <p
              style={{
                color: "#dc2626",
                fontWeight: 600,
                backgroundColor: "#fef2f2",
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid #fecaca",
              }}
            >
              🚨 Significant Violations Detected
            </p>
          )}
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 12,
        }}
      >
        {[
          {
            label: "Face Missing",
            value: summary.face_missing || 0,
            emoji: "🙈",
            danger: (summary.face_missing || 0) > 0,
          },
          {
            label: "Multiple Faces",
            value: summary.multiple_faces || 0,
            emoji: "👥",
            danger: (summary.multiple_faces || 0) > 0,
          },
          {
            label: "Tab Switches",
            value: summary.tab_switch || 0,
            emoji: "🧭",
            danger: (summary.tab_switch || 0) > 0,
          },
          {
            label: "Fullscreen Exit",
            value: summary.fullscreen_exit || 0,
            emoji: "🖥️",
            danger: (summary.fullscreen_exit || 0) > 0,
          },
          {
            label: "Page Reloads",
            value: summary.page_reload || 0,
            emoji: "🔄",
            danger: (summary.page_reload || 0) > 0,
          },
          {
            label: "Loud Audio",
            value: summary.excessive_audio || 0,
            emoji: "🔊",
            danger: (summary.excessive_audio || 0) > 0,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="card"
            style={{
              textAlign: "center",
              backgroundColor: stat.danger && stat.value > 0
                ? "#fef2f2"
                : "white",
              border: stat.danger && stat.value > 0
                ? "1px solid #fecaca"
                : "1px solid #f1f5f9",
              padding: "1rem",
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 6 }}>{stat.emoji}</div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                color:
                  stat.danger && stat.value > 0 ? "#dc2626" : "#16a34a",
                letterSpacing: "-0.02em",
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#64748b",
                marginTop: 4,
                fontWeight: 500,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Event Timeline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <h3
            style={{
              fontWeight: 700,
              color: "#0f172a",
              fontSize: 15,
            }}
          >
            Event Timeline
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#94a3b8",
                marginLeft: 8,
              }}
            >
              ({filteredEvents.length} events)
            </span>
          </h3>

          {/* Filter */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { value: "all", label: "All" },
              { value: "violations", label: "⚠️ Violations" },
              { value: "high", label: "🔴 High" },
              { value: "medium", label: "🟡 Medium" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                style={{
                  padding: "4px 12px",
                  borderRadius: 8,
                  border: `1.5px solid ${
                    filter === f.value ? "#6366f1" : "#e2e8f0"
                  }`,
                  backgroundColor:
                    filter === f.value ? "#eef2ff" : "white",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  color: filter === f.value ? "#4338ca" : "#64748b",
                  fontFamily: "inherit",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "#94a3b8",
              fontSize: 13,
            }}
          >
            No events match the selected filter
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxHeight: 480,
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            {filteredEvents.map((event, index) => {
              const sc =
                severityConfig[event.severity] || severityConfig.info;
              const emoji =
                eventEmojis[event.eventType] || "📌";

              return (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "12px 14px",
                    backgroundColor: "#f8fafc",
                    borderRadius: 10,
                    alignItems: "flex-start",
                  }}
                >
                  {/* Emoji */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: sc.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {emoji}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#0f172a",
                        marginBottom: 2,
                        textTransform: "capitalize",
                      }}
                    >
                      {event.eventType.replaceAll("_", " ")}
                    </p>
                    <p style={{ fontSize: 11, color: "#94a3b8" }}>
                      {formatDateTime(event.timestamp)}
                    </p>
                    {event.metadata &&
                      Object.keys(event.metadata).length > 0 && (
                        <p
                          style={{
                            fontSize: 11,
                            color: "#64748b",
                            marginTop: 4,
                            fontFamily: "monospace",
                          }}
                        >
                          {JSON.stringify(event.metadata)}
                        </p>
                      )}
                  </div>

                  {/* Right */}
                  <div
                    style={{ textAlign: "right", flexShrink: 0 }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 99,
                        backgroundColor: sc.bg,
                        color: sc.color,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      {sc.label}
                    </span>
                    {event.riskDelta > 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#dc2626",
                        }}
                      >
                        +{event.riskDelta} pts
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Risk Calculation Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="card"
        style={{ backgroundColor: "#f8fafc" }}
      >
        <h3
          style={{
            fontWeight: 700,
            color: "#0f172a",
            fontSize: 14,
            marginBottom: 12,
          }}
        >
          📊 Risk Score Calculation
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 8,
          }}
        >
          {[
            { event: "Face Missing", points: "+10" },
            { event: "Multiple Faces", points: "+20" },
            { event: "Tab Switch", points: "+15" },
            { event: "Window Blur", points: "+15" },
            { event: "Fullscreen Exit", points: "+10" },
            { event: "Page Reload", points: "+15" },
            { event: "Excessive Audio", points: "+10" },
          ].map((item) => (
            <div
              key={item.event}
              style={{
                backgroundColor: "white",
                borderRadius: 8,
                padding: "8px 12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid #f1f5f9",
              }}
            >
              <span style={{ fontSize: 12, color: "#374151" }}>
                {item.event}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#dc2626",
                }}
              >
                {item.points}
              </span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 10 }}>
          0-20 pts = Low Risk · 21-50 pts = Medium Risk · 51+ pts = High Risk
        </p>
      </motion.div>
    </div>
  );
};

export default ProctoringReport;