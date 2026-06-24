import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import testService from "../services/testService.js";
import useToast from "../hooks/useToast.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import {
  formatDateTime,
  formatTime,
  getGrade,
  getGradeColor,
} from "../utils/formatters.js";

const AttemptHistory = () => {
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await testService.getHistory({ page, limit: 10 });
      setAttempts(res.data || []);
      setPagination(res.pagination || {});
    } catch {
      toastError("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

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
          Attempt History
        </h1>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
          {pagination.totalItems || 0} test attempt
          {pagination.totalItems !== 1 ? "s" : ""}
        </p>
      </motion.div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : attempts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card"
          style={{ textAlign: "center", padding: "4rem 2rem" }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ fontSize: 56, marginBottom: 16 }}
          >
            📊
          </motion.div>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#374151",
              marginBottom: 8,
            }}
          >
            No attempts yet
          </h3>
          <p
            style={{
              color: "#94a3b8",
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            Take your first test to see your history here
          </p>
          <button
            onClick={() => navigate("/my-tests")}
            className="btn-primary"
          >
            Go to Tests
          </button>
        </motion.div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {attempts.map((attempt, index) => {
              const grade = getGrade(attempt.percentage);
              const gc = getGradeColor(attempt.percentage);

              return (
                <motion.div
                  key={attempt._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                    padding: "1rem 1.25rem",
                  }}
                  whileHover={{
                    boxShadow: "0 6px 20px rgba(0,0,0,0.07)",
                  }}
                >
                  {/* Grade Circle */}
                  <div
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: "50%",
                      border: `3px solid ${gc.color}`,
                      backgroundColor: gc.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 900,
                        color: gc.color,
                      }}
                    >
                      {grade}
                    </span>
                  </div>

                  {/* Test Info */}
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#0f172a",
                        marginBottom: 4,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {attempt.testId?.title || "Test"}
                    </p>
                    <p style={{ fontSize: 12, color: "#94a3b8" }}>
                      {formatDateTime(attempt.submittedAt)}
                    </p>
                  </div>

                  {/* Stats */}
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <p
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color: gc.color,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {attempt.percentage}%
                      </p>
                      <p style={{ fontSize: 11, color: "#94a3b8" }}>Score</p>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#16a34a",
                        }}
                      >
                        {attempt.correctAnswers}✓
                      </p>
                      <p style={{ fontSize: 11, color: "#94a3b8" }}>
                        Correct
                      </p>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#dc2626",
                        }}
                      >
                        {attempt.wrongAnswers}✗
                      </p>
                      <p style={{ fontSize: 11, color: "#94a3b8" }}>Wrong</p>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#374151",
                        }}
                      >
                        {formatTime(attempt.timeTaken)}
                      </p>
                      <p style={{ fontSize: 11, color: "#94a3b8" }}>Time</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => navigate(`/result/${attempt._id}`)}
                      className="btn-primary"
                      style={{ fontSize: 12, padding: "8px 14px" }}
                    >
                      View Result
                    </button>
                    <button
                      onClick={() =>
                        navigate(
                          `/test/${attempt.testId?._id || attempt.testId}`
                        )
                      }
                      className="btn-secondary"
                      style={{ fontSize: 12, padding: "8px 14px" }}
                    >
                      Retake
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 12,
              }}
            >
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrevPage}
                className="btn-secondary"
                style={{
                  opacity: pagination.hasPrevPage ? 1 : 0.4,
                  fontSize: 13,
                }}
              >
                ← Previous
              </button>
              <span style={{ fontSize: 13, color: "#64748b" }}>
                {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNextPage}
                className="btn-secondary"
                style={{
                  opacity: pagination.hasNextPage ? 1 : 0.4,
                  fontSize: 13,
                }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AttemptHistory;