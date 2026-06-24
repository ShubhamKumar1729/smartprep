import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import testService from "../services/testService.js";
import useToast from "../hooks/useToast.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import { formatDate, formatDuration } from "../utils/formatters.js";

const difficultyConfig = {
  easy: { color: "#16a34a", bg: "#f0fdf4", label: "Easy" },
  medium: { color: "#d97706", bg: "#fffbeb", label: "Medium" },
  hard: { color: "#dc2626", bg: "#fef2f2", label: "Hard" },
  mixed: { color: "#6366f1", bg: "#eef2ff", label: "Mixed" },
};

const Tests = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTest, setDeleteTest] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await testService.getAll({
        page,
        limit: 9,
        search,
        sort: "-createdAt",
      });
      setTests(res.data || []);
      setPagination(res.pagination || {});
    } catch {
      toastError("Failed to load tests");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await testService.delete(deleteTest._id);
      success("Test deleted");
      setDeleteTest(null);
      fetchTests();
    } catch {
      toastError("Failed to delete test");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em",
            }}
          >
            My Tests
          </h1>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
            {pagination.totalItems || 0} test
            {pagination.totalItems !== 1 ? "s" : ""} created
          </p>
        </div>
        <button
          onClick={() => navigate("/home")}
          className="btn-primary"
          style={{ fontSize: 13 }}
        >
          + Create New Test
        </button>
      </motion.div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#94a3b8",
          }}
        >
          🔍
        </span>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search tests..."
          className="form-input"
          style={{ paddingLeft: 42 }}
        />
      </div>

      {/* Tests Grid */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : tests.length === 0 ? (
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
            📋
          </motion.div>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#374151",
              marginBottom: 8,
            }}
          >
            {search ? "No tests found" : "No tests yet"}
          </h3>
          <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 20 }}>
            {search
              ? "Try different keywords"
              : "Select files and click Test Me to create your first test"}
          </p>
          {!search && (
            <button
              onClick={() => navigate("/home")}
              className="btn-primary"
            >
              Go to Home & Create Test
            </button>
          )}
        </motion.div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {tests.map((test, index) => {
              const dc =
                difficultyConfig[test.difficulty] || difficultyConfig.mixed;

              return (
                <motion.div
                  key={test._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="card"
                  style={{ position: "relative" }}
                  whileHover={{
                    boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
                    y: -2,
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                      }}
                    >
                      📋
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        onClick={() => navigate(`/test/${test._id}`)}
                        style={{
                          padding: "6px 10px",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          borderRadius: 8,
                          fontSize: 15,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#eef2ff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                        title="View Test"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => setDeleteTest(test)}
                        style={{
                          padding: "6px 10px",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          borderRadius: 8,
                          fontSize: 15,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#fef2f2";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                        title="Delete Test"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    className="line-clamp-2"
                    style={{
                      fontWeight: 700,
                      color: "#0f172a",
                      fontSize: 15,
                      marginBottom: 10,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {test.title}
                  </h3>

                  {/* Tags */}
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      marginBottom: 14,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 99,
                        backgroundColor: dc.bg,
                        color: dc.color,
                      }}
                    >
                      {dc.label}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 10px",
                        borderRadius: 99,
                        backgroundColor: "#f1f5f9",
                        color: "#64748b",
                        textTransform: "capitalize",
                      }}
                    >
                      {test.testType}
                    </span>
                  </div>

                  {/* Stats */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      marginBottom: 14,
                    }}
                  >
                    {[
                      { label: "Questions", value: test.questionCount, emoji: "❓" },
                      { label: "Duration", value: formatDuration(test.duration), emoji: "⏱️" },
                      { label: "Attempts", value: test.totalAttempts || 0, emoji: "🔄" },
                      { label: "Created", value: formatDate(test.createdAt), emoji: "📅" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        style={{
                          backgroundColor: "#f8fafc",
                          borderRadius: 8,
                          padding: "8px 10px",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 10,
                            color: "#94a3b8",
                            marginBottom: 2,
                          }}
                        >
                          {stat.emoji} {stat.label}
                        </p>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#0f172a",
                          }}
                        >
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Start Button */}
                  <button
                    onClick={() => navigate(`/test/${test._id}`)}
                    className="btn-primary"
                    style={{ width: "100%", fontSize: 13 }}
                  >
                    🚀 Start Test
                  </button>
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

      <ConfirmDialog
        isOpen={!!deleteTest}
        onClose={() => setDeleteTest(null)}
        onConfirm={handleDelete}
        title="Delete Test"
        message={`Delete "${deleteTest?.title}"? All questions will be removed. This cannot be undone.`}
        confirmText="Delete Test"
        danger
        loading={deleteLoading}
      />
    </div>
  );
};

export default Tests;