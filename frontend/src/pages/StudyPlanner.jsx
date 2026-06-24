import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import plannerService from "../services/plannerService.js";
import useToast from "../hooks/useToast.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import { formatDate } from "../utils/formatters.js";

const priorityColors = {
  high: { color: "#dc2626", bg: "#fef2f2", label: "High Priority" },
  medium: { color: "#d97706", bg: "#fffbeb", label: "Medium Priority" },
  low: { color: "#16a34a", bg: "#f0fdf4", label: "Low Priority" },
};

const StudyPlanner = () => {
  const { success, error: toastError } = useToast();

  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [completedDays, setCompletedDays] = useState({});

  const [form, setForm] = useState({
    target: "End Semester Exam",
    duration: "7",
    hoursPerDay: "2",
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await plannerService.getAll();
      const fetchedPlans = res.data.plans || [];
      setPlans(fetchedPlans);
      if (fetchedPlans.length > 0) setActivePlan(fetchedPlans[0]);
    } catch {
      toastError("Failed to load study plans");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await plannerService.generate({
        target: form.target,
        duration: form.duration,
        hoursPerDay: form.hoursPerDay,
      });
      success("Study plan generated! 📅");
      setActivePlan(res.data.studyPlan);
      fetchPlans();
      setCompletedDays({});
    } catch {
      toastError("Failed to generate plan");
    } finally {
      setGenerating(false);
    }
  };

  const toggleDayComplete = (day) => {
    setCompletedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  const completedCount = Object.values(completedDays).filter(Boolean).length;
  const totalDays = activePlan?.plan?.length || 0;
  const progressPercent = totalDays > 0
    ? Math.round((completedCount / totalDays) * 100)
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.02em",
          }}
        >
          Study Planner
        </h1>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
          AI-generated personalized study plans based on your weak topics
        </p>
      </motion.div>

      {/* Generate Form */}
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
            fontSize: 15,
            marginBottom: 16,
          }}
        >
          ✨ Generate New Plan
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {/* Target */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Exam Target
            </label>
            <input
              type="text"
              value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value })}
              placeholder="e.g. End Semester Exam"
              className="form-input"
              style={{ fontSize: 13 }}
            />
          </div>

          {/* Duration */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Duration (Days)
            </label>
            <select
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              className="form-input"
              style={{ fontSize: 13 }}
            >
              <option value="3">3 Days</option>
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days</option>
            </select>
          </div>

          {/* Hours */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Hours Per Day
            </label>
            <select
              value={form.hoursPerDay}
              onChange={(e) =>
                setForm({ ...form, hoursPerDay: e.target.value })
              }
              className="form-input"
              style={{ fontSize: 13 }}
            >
              <option value="1">1 Hour</option>
              <option value="2">2 Hours</option>
              <option value="3">3 Hours</option>
              <option value="4">4 Hours</option>
              <option value="6">6 Hours</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary"
          style={{ width: "100%" }}
        >
          {generating ? (
            <>
              <LoadingSpinner size="sm" color="white" />
              Generating Plan...
            </>
          ) : (
            "📅 Generate Study Plan"
          )}
        </button>
      </motion.div>

      {/* Loading */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 50 }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : !activePlan ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card"
          style={{ textAlign: "center", padding: "3rem" }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ fontSize: 56, marginBottom: 16 }}
          >
            📅
          </motion.div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#374151",
              marginBottom: 8,
            }}
          >
            No study plan yet
          </h3>
          <p style={{ color: "#94a3b8", fontSize: 13 }}>
            Generate your first personalized study plan above
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {/* Plan Header */}
          <div className="card">
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#0f172a",
                    letterSpacing: "-0.02em",
                    marginBottom: 4,
                  }}
                >
                  {activePlan.target}
                </h2>
                <p style={{ color: "#64748b", fontSize: 13 }}>
                  {activePlan.duration} days ·{" "}
                  {activePlan.hoursPerDay} hours/day ·{" "}
                  Generated {formatDate(activePlan.generatedDate)}
                </p>
              </div>

              {/* Plans selector */}
              {plans.length > 1 && (
                <select
                  value={activePlan._id}
                  onChange={(e) => {
                    const plan = plans.find((p) => p._id === e.target.value);
                    if (plan) {
                      setActivePlan(plan);
                      setCompletedDays({});
                    }
                  }}
                  className="form-input"
                  style={{ width: "auto", fontSize: 13 }}
                >
                  {plans.map((plan) => (
                    <option key={plan._id} value={plan._id}>
                      {plan.target} — {formatDate(plan.generatedDate)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Progress */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 8,
                }}
              >
                <span style={{ fontWeight: 600, color: "#374151" }}>
                  Your Progress
                </span>
                <span style={{ fontWeight: 700, color: "#6366f1" }}>
                  {completedCount}/{totalDays} days ({progressPercent}%)
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  backgroundColor: "#f1f5f9",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <motion.div
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5 }}
                  style={{
                    height: "100%",
                    background:
                      "linear-gradient(90deg, #6366f1, #8b5cf6)",
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>

            {/* Key Topics */}
            {activePlan.topics?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 8,
                  }}
                >
                  Focus Topics
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {activePlan.topics.slice(0, 8).map((topic, i) => {
                    const pc =
                      priorityColors[topic.priority] || priorityColors.medium;
                    return (
                      <span
                        key={i}
                        style={{
                          backgroundColor: pc.bg,
                          color: pc.color,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 999,
                        }}
                      >
                        {topic.topic}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Day Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activePlan.plan?.map((day, index) => {
              const isDone = completedDays[day.day];
              const isToday = index === completedCount;

              return (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  style={{
                    backgroundColor: "white",
                    borderRadius: 14,
                    border: `1.5px solid ${
                      isDone
                        ? "#bbf7d0"
                        : isToday
                        ? "#c7d2fe"
                        : "#f1f5f9"
                    }`,
                    overflow: "hidden",
                    transition: "all 0.2s",
                    opacity: isDone ? 0.75 : 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 16px",
                      cursor: "pointer",
                    }}
                    onClick={() => toggleDayComplete(day.day)}
                  >
                    {/* Day Number */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: isDone
                          ? "linear-gradient(135deg, #16a34a, #15803d)"
                          : isToday
                          ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                          : "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: isDone || isToday
                          ? "0 4px 10px rgba(0,0,0,0.12)"
                          : "none",
                      }}
                    >
                      {isDone ? (
                        <span style={{ fontSize: 18 }}>✓</span>
                      ) : (
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color:
                              isToday ? "white" : "#64748b",
                          }}
                        >
                          {day.day}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: isDone ? "#16a34a" : "#0f172a",
                            textDecoration: isDone
                              ? "line-through"
                              : "none",
                          }}
                          className="line-clamp-1"
                        >
                          {day.title}
                        </p>
                        {isToday && !isDone && (
                          <span
                            style={{
                              backgroundColor: "#eef2ff",
                              color: "#4338ca",
                              fontSize: 10,
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: 999,
                              flexShrink: 0,
                            }}
                          >
                            TODAY
                          </span>
                        )}
                        {isDone && (
                          <span
                            style={{
                              backgroundColor: "#f0fdf4",
                              color: "#16a34a",
                              fontSize: 10,
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: 999,
                              flexShrink: 0,
                            }}
                          >
                            DONE
                          </span>
                        )}
                      </div>

                      {/* Tasks */}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 4,
                        }}
                      >
                        {day.tasks.slice(0, 2).map((task, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 11,
                              color: "#94a3b8",
                              backgroundColor: "#f8fafc",
                              padding: "2px 8px",
                              borderRadius: 999,
                            }}
                          >
                            {task}
                          </span>
                        ))}
                        {day.tasks.length > 2 && (
                          <span
                            style={{
                              fontSize: 11,
                              color: "#94a3b8",
                            }}
                          >
                            +{day.tasks.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Checkbox */}
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        border: `2px solid ${
                          isDone ? "#16a34a" : "#e2e8f0"
                        }`,
                        backgroundColor: isDone ? "#16a34a" : "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.2s",
                      }}
                    >
                      {isDone && (
                        <span
                          style={{
                            color: "white",
                            fontSize: 13,
                            fontWeight: 800,
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Completion Banner */}
          <AnimatePresence>
            {progressPercent === 100 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  background:
                    "linear-gradient(135deg, #052e16, #065f46)",
                  borderRadius: 16,
                  padding: "1.5rem",
                  textAlign: "center",
                  color: "white",
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    marginBottom: 6,
                  }}
                >
                  Study Plan Completed!
                </h3>
                <p style={{ opacity: 0.75, fontSize: 14 }}>
                  Excellent dedication! You're ready for your exam.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default StudyPlanner;