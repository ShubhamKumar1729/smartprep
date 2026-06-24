import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import analyticsService from "../services/analyticsService.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import useToast from "../hooks/useToast.js";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const Analytics = () => {
  const { error: toastError } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService
      .dashboard()
      .then((res) => setData(res.data))
      .catch(() => toastError("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const basic = data?.basic || {};
  const topics = data?.topics || {};
  const readiness = data?.readiness || {};

  const readinessColor =
    readiness.readinessScore >= 85
      ? "#16a34a"
      : readiness.readinessScore >= 70
      ? "#6366f1"
      : readiness.readinessScore >= 50
      ? "#d97706"
      : "#dc2626";

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #f1f5f9",
            borderRadius: 10,
            padding: "10px 14px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
            Attempt {label}
          </p>
          <p
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#6366f1",
            }}
          >
            {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      style={{ display: "flex", flexDirection: "column", gap: 24 }}
    >
      {/* Header */}
      <motion.div variants={item}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.02em",
          }}
        >
          Analytics Dashboard
        </h1>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
          Track your performance, accuracy and readiness
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 14,
          }}
        >
          {[
            {
              label: "Average Score",
              value: `${basic.averageScore || 0}%`,
              emoji: "🎯",
              color: "#6366f1",
              bg: "#eef2ff",
            },
            {
              label: "Highest Score",
              value: `${basic.highestScore || 0}%`,
              emoji: "🏆",
              color: "#16a34a",
              bg: "#f0fdf4",
            },
            {
              label: "Lowest Score",
              value: `${basic.lowestScore || 0}%`,
              emoji: "📉",
              color: "#dc2626",
              bg: "#fef2f2",
            },
            {
              label: "Tests Taken",
              value: basic.totalTestsTaken || 0,
              emoji: "📋",
              color: "#8b5cf6",
              bg: "#faf5ff",
            },
            {
              label: "Avg Time",
              value: basic.averageTimeTaken
                ? `${Math.round(basic.averageTimeTaken / 60)}m`
                : "—",
              emoji: "⏱️",
              color: "#d97706",
              bg: "#fffbeb",
            },
            {
              label: "Readiness",
              value: `${readiness.readinessScore || 0}%`,
              emoji: "🧠",
              color: readinessColor,
              bg: "#f8fafc",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="card"
              style={{ transition: "all 0.2s" }}
              whileHover={{
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                y: -2,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: stat.bg,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  marginBottom: 12,
                }}
              >
                {stat.emoji}
              </div>
              <p
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: stat.color,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  marginTop: 4,
                  fontWeight: 500,
                }}
              >
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Readiness Banner */}
      {readiness.readinessScore > 0 && (
        <motion.div
          variants={item}
          style={{
            background: `linear-gradient(135deg, ${readinessColor}15, ${readinessColor}08)`,
            border: `1px solid ${readinessColor}30`,
            borderRadius: 16,
            padding: "1.25rem 1.5rem",
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              border: `4px solid ${readinessColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              backgroundColor: "white",
            }}
          >
            <span
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: readinessColor,
              }}
            >
              {readiness.readinessScore}%
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontWeight: 800,
                color: "#0f172a",
                fontSize: 16,
                marginBottom: 4,
                textTransform: "capitalize",
              }}
            >
              Readiness: {readiness.readinessStatus}
            </p>
            <p style={{ color: "#374151", fontSize: 13, lineHeight: 1.6 }}>
              {readiness.recommendation}
            </p>
          </div>
        </motion.div>
      )}

      {/* Score Trend Chart */}
      {basic.scoreTrend?.length > 0 && (
        <motion.div variants={item} className="card">
          <h3
            style={{
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 20,
              fontSize: 15,
            }}
          >
            📈 Score Trend
          </h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={basic.scoreTrend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="attempt"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={{ stroke: "#f1f5f9" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ fill: "#6366f1", r: 5, strokeWidth: 2, stroke: "white" }}
                  activeDot={{ r: 7, fill: "#4338ca" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Topic Performance */}
      {topics.topicPerformance?.length > 0 && (
        <motion.div variants={item} className="card">
          <h3
            style={{
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 20,
              fontSize: 15,
            }}
          >
            📊 Topic Performance
          </h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topics.topicPerformance.slice(0, 10)}
                margin={{ top: 5, right: 5, left: -20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="topic"
                  tick={{
                    fontSize: 11,
                    fill: "#94a3b8",
                    textAnchor: "end",
                  }}
                  angle={-35}
                  interval={0}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #f1f5f9",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
                  {topics.topicPerformance
                    .slice(0, 10)
                    .map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          entry.accuracy >= 85
                            ? "#16a34a"
                            : entry.accuracy < 60
                            ? "#ef4444"
                            : "#6366f1"
                        }
                      />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Weak & Strong Topics */}
      <motion.div
        variants={item}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {/* Weak Topics */}
        <div className="card">
          <h3
            style={{
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 14,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            ⚠️ Weak Topics
          </h3>
          {!topics.weakTopics?.length ? (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>
              No weak topics. Great job! 🎉
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {topics.weakTopics.map((topic, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "#fef2f2",
                    borderRadius: 10,
                    padding: "10px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  >
                    {topic.topic}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#dc2626",
                    }}
                  >
                    {topic.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Strong Topics */}
        <div className="card">
          <h3
            style={{
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 14,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            💪 Strong Topics
          </h3>
          {!topics.strongTopics?.length ? (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>
              Keep practicing to build strong topics!
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {topics.strongTopics.map((topic, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "#f0fdf4",
                    borderRadius: 10,
                    padding: "10px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  >
                    {topic.topic}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#16a34a",
                    }}
                  >
                    {topic.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Empty State */}
      {!basic.totalTestsTaken && (
        <motion.div
          variants={item}
          className="card"
          style={{ textAlign: "center", padding: "3rem" }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#374151",
              marginBottom: 8,
            }}
          >
            No data yet
          </h3>
          <p style={{ color: "#94a3b8", fontSize: 13 }}>
            Take at least one test to see your analytics
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Analytics;