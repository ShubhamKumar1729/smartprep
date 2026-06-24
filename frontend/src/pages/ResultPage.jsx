import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import testService from "../services/testService.js";
import useToast from "../hooks/useToast.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import {
  formatTime,
  getGrade,
  getGradeColor,
} from "../utils/formatters.js";

const ResultPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [reviewFilter, setReviewFilter] = useState("all");

  useEffect(() => {
    testService
      .getResult(attemptId)
      .then((res) => setData(res.data))
      .catch(() => {
        toastError("Failed to load result");
        navigate("/my-tests");
      })
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "70vh",
        }}
      >
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { result, reviewData = [], attempt } = data;
  const grade = getGrade(result?.percentage);
  const gc = getGradeColor(result?.percentage);

  const filteredReview = reviewData.filter((r) => {
    if (reviewFilter === "correct") return r.isCorrect;
    if (reviewFilter === "wrong") return !r.isCorrect && !r.isSkipped;
    if (reviewFilter === "skipped") return r.isSkipped;
    return true;
  });

  return (
    <div
      style={{
        maxWidth: 860,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: "center", padding: "1.5rem 0 0.5rem" }}
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ fontSize: 64, marginBottom: 16 }}
        >
          {result?.percentage >= 85
            ? "🎉"
            : result?.percentage >= 70
            ? "👍"
            : result?.percentage >= 50
            ? "📚"
            : "💪"}
        </motion.div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#0f172a",
            marginBottom: 6,
            letterSpacing: "-0.02em",
          }}
        >
          Test Completed!
        </h1>
        <p style={{ color: "#64748b", fontSize: 15 }}>{result?.remark}</p>
      </motion.div>

      {/* Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          background: "linear-gradient(135deg, #f0f4ff, #faf5ff)",
          borderRadius: 20,
          padding: "2rem",
          textAlign: "center",
          border: "1px solid #e0e7ff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 32,
            flexWrap: "wrap",
          }}
        >
          {/* Grade Ring */}
          <div
            style={{
              width: 110,
              height: 110,
              borderRadius: "50%",
              border: `6px solid ${gc.color}`,
              backgroundColor: gc.bg,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 0 4px ${gc.border}`,
            }}
          >
            <span
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: gc.color,
                lineHeight: 1,
              }}
            >
              {grade}
            </span>
          </div>

          {/* Score */}
          <div>
            <p
              style={{
                fontSize: 56,
                fontWeight: 900,
                color: "#0f172a",
                lineHeight: 1,
                letterSpacing: "-0.03em",
              }}
            >
              {result?.score}
              <span style={{ fontSize: 28, color: "#94a3b8" }}>
                /{result?.totalQuestions}
              </span>
            </p>
            <p
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: gc.color,
                marginTop: 4,
              }}
            >
              {result?.percentage}%
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 12,
        }}
      >
        {[
          {
            label: "Correct",
            value: result?.correctAnswers,
            emoji: "✅",
            color: "#16a34a",
            bg: "#f0fdf4",
          },
          {
            label: "Wrong",
            value: result?.wrongAnswers,
            emoji: "❌",
            color: "#dc2626",
            bg: "#fef2f2",
          },
          {
            label: "Skipped",
            value: result?.skippedAnswers,
            emoji: "⏭️",
            color: "#d97706",
            bg: "#fffbeb",
          },
          {
            label: "Time Taken",
            value: formatTime(result?.timeTaken || 0),
            emoji: "⏱️",
            color: "#6366f1",
            bg: "#eef2ff",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: stat.bg,
              borderRadius: 14,
              padding: "1rem",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 8 }}>{stat.emoji}</div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: stat.color,
                letterSpacing: "-0.02em",
              }}
            >
              {stat.value}
            </div>
            <div
              style={{ fontSize: 12, color: "#64748b", marginTop: 4, fontWeight: 500 }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Progress Breakdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
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
          Score Breakdown
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            {
              label: "Correct",
              count: result?.correctAnswers,
              color: "#16a34a",
            },
            {
              label: "Wrong",
              count: result?.wrongAnswers,
              color: "#dc2626",
            },
            {
              label: "Skipped",
              count: result?.skippedAnswers,
              color: "#d97706",
            },
          ].map((item) => (
            <div key={item.label}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{ color: "#374151", fontWeight: 600 }}
                >
                  {item.label}
                </span>
                <span
                  style={{ color: item.color, fontWeight: 700 }}
                >
                  {item.count} (
                  {Math.round(
                    (item.count / result?.totalQuestions) * 100
                  )}
                  %)
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  backgroundColor: "#f1f5f9",
                  borderRadius: 99,
                  overflow: "hidden",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      (item.count / result?.totalQuestions) * 100
                    }%`,
                  }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                  style={{
                    height: "100%",
                    backgroundColor: item.color,
                    borderRadius: 99,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setShowReview(!showReview)}
          className="btn-primary"
          style={{ flex: 1, minWidth: 140 }}
        >
          {showReview ? "Hide Review" : "📖 Review Answers"}
        </button>
        <button
          onClick={() =>
            navigate(
              `/proctoring/${attemptId}`
            )
          }
          className="btn-secondary"
          style={{ flex: 1, minWidth: 140 }}
        >
          🛡️ Proctoring Report
        </button>
        <button
          onClick={() =>
            navigate(
              `/test/${attempt?.testId?._id || attempt?.testId}`
            )
          }
          className="btn-secondary"
          style={{ flex: 1, minWidth: 140 }}
        >
          🔄 Retake Test
        </button>
        <button
          onClick={() => navigate("/my-tests")}
          className="btn-secondary"
          style={{ flex: 1, minWidth: 140 }}
        >
          🏠 Back to Tests
        </button>
      </motion.div>

      {/* Answer Review */}
      <AnimatePresence>
        {showReview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              {/* Filter */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <h3
                  style={{
                    fontWeight: 700,
                    color: "#0f172a",
                    fontSize: 16,
                  }}
                >
                  Answer Review
                </h3>
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    { value: "all", label: "All" },
                    { value: "correct", label: "✅ Correct" },
                    { value: "wrong", label: "❌ Wrong" },
                    { value: "skipped", label: "⏭️ Skipped" },
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setReviewFilter(f.value)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 8,
                        border: `1.5px solid ${
                          reviewFilter === f.value ? "#6366f1" : "#e2e8f0"
                        }`,
                        backgroundColor:
                          reviewFilter === f.value ? "#eef2ff" : "white",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        color:
                          reviewFilter === f.value ? "#4338ca" : "#64748b",
                        fontFamily: "inherit",
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Questions */}
              {filteredReview.map((review, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="card"
                  style={{
                    borderLeft: `4px solid ${
                      review.isCorrect
                        ? "#16a34a"
                        : review.isSkipped
                        ? "#d97706"
                        : "#ef4444"
                    }`,
                    padding: "1.25rem",
                  }}
                >
                  {/* Question */}
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        backgroundColor: review.isCorrect
                          ? "#f0fdf4"
                          : review.isSkipped
                          ? "#fffbeb"
                          : "#fef2f2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      {review.isCorrect
                        ? "✅"
                        : review.isSkipped
                        ? "⏭️"
                        : "❌"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#94a3b8",
                          marginBottom: 4,
                          textTransform: "capitalize",
                        }}
                      >
                        {review.questionType}
                      </p>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: "#0f172a",
                          lineHeight: 1.6,
                        }}
                      >
                        {review.question}
                      </p>
                    </div>
                  </div>

                  {/* MCQ Options */}
                  {review.questionType === "mcq" &&
                    review.options?.length > 0 && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 6,
                          marginBottom: 12,
                          marginLeft: 40,
                        }}
                      >
                        {review.options.map((opt, i) => {
                          const isCorrect = opt === review.correctAnswer;
                          const isWrong =
                            opt === review.selectedAnswer && !review.isCorrect;
                          return (
                            <div
                              key={i}
                              style={{
                                padding: "7px 10px",
                                borderRadius: 8,
                                fontSize: 12,
                                backgroundColor: isCorrect
                                  ? "#f0fdf4"
                                  : isWrong
                                  ? "#fef2f2"
                                  : "#f8fafc",
                                color: isCorrect
                                  ? "#16a34a"
                                  : isWrong
                                  ? "#dc2626"
                                  : "#374151",
                                fontWeight:
                                  isCorrect || isWrong ? 700 : 400,
                                border: `1px solid ${
                                  isCorrect
                                    ? "#bbf7d0"
                                    : isWrong
                                    ? "#fecaca"
                                    : "#f1f5f9"
                                }`,
                              }}
                            >
                              {String.fromCharCode(65 + i)}. {opt}
                              {isCorrect && " ✓"}
                              {isWrong && " ✗"}
                            </div>
                          );
                        })}
                      </div>
                    )}

                  {/* Answers */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      marginLeft: 40,
                    }}
                  >
                    {review.selectedAnswer && (
                      <div
                        style={{
                          padding: "10px 12px",
                          borderRadius: 8,
                          backgroundColor: review.isCorrect
                            ? "#f0fdf4"
                            : "#fef2f2",
                          border: `1px solid ${
                            review.isCorrect ? "#bbf7d0" : "#fecaca"
                          }`,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: review.isCorrect ? "#16a34a" : "#dc2626",
                            marginBottom: 2,
                          }}
                        >
                          Your Answer:
                        </p>
                        <p
                          style={{
                            fontSize: 13,
                            color: review.isCorrect ? "#166534" : "#991b1b",
                          }}
                        >
                          {review.selectedAnswer}
                        </p>
                      </div>
                    )}

                    {!review.isCorrect && review.correctAnswer && (
                      <div
                        style={{
                          padding: "10px 12px",
                          borderRadius: 8,
                          backgroundColor: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#16a34a",
                            marginBottom: 2,
                          }}
                        >
                          ✓ Correct Answer:
                        </p>
                        <p style={{ fontSize: 13, color: "#166534" }}>
                          {review.correctAnswer}
                        </p>
                      </div>
                    )}

                    {review.explanation && (
                      <div
                        style={{
                          padding: "10px 12px",
                          borderRadius: 8,
                          backgroundColor: "#eef2ff",
                          border: "1px solid #c7d2fe",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#4338ca",
                            marginBottom: 2,
                          }}
                        >
                          💡 Explanation:
                        </p>
                        <p style={{ fontSize: 13, color: "#3730a3" }}>
                          {review.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResultPage;