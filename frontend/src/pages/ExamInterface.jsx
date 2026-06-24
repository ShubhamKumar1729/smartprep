import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import testService from "../services/testService.js";
import proctoringService from "../services/proctoringService.js";
import useToast from "../hooks/useToast.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import ProctoringMonitor from "../components/proctoring/ProctoringMonitor.jsx";

const ExamInterface = () => {
  const { attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { warning, success, error: toastError } = useToast();

  const {
    attempt,
    test,
    questions = [],
    savedResponses = [],
  } = location.state || {};

  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [timeLeft, setTimeLeft] = useState((test?.duration || 30) * 60);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const timerRef = useRef(null);
  const autoSaveRef = useRef(null);
  const hasWarned5 = useRef(false);
  const hasWarned1 = useRef(false);

  // ── Init saved responses ──
  useEffect(() => {
    if (savedResponses.length > 0) {
      const map = {};
      savedResponses.forEach((r) => {
        map[r.questionId] = r.selectedAnswer || "";
      });
      setResponses(map);
    }
  }, []);

  // ── Track fullscreen state ──
  useEffect(() => {
    const check = () => {
      setIsFullscreen(
        !!(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement
        )
      );
    };
    check();
    document.addEventListener("fullscreenchange", check);
    document.addEventListener("webkitfullscreenchange", check);
    document.addEventListener("mozfullscreenchange", check);
    return () => {
      document.removeEventListener("fullscreenchange", check);
      document.removeEventListener("webkitfullscreenchange", check);
      document.removeEventListener("mozfullscreenchange", check);
    };
  }, []);

  // ── Fullscreen monitoring ──
  useEffect(() => {
    const handleFSChange = () => {
      const isFS = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      );
      setIsFullscreen(isFS);

      if (!isFS && !submitting) {
        if (attempt?._id && test?._id) {
          proctoringService
            .event({
              attemptId: attempt._id,
              testId: test._id,
              eventType: "fullscreen_exit",
              severity: "medium",
              metadata: { timestamp: new Date().toISOString() },
            })
            .catch(() => {});
        }
        warning("⚠️ Fullscreen exited. This has been recorded.");
      }
    };

    document.addEventListener("fullscreenchange", handleFSChange);
    document.addEventListener("webkitfullscreenchange", handleFSChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFSChange);
      document.removeEventListener("webkitfullscreenchange", handleFSChange);
    };
  }, [submitting, attempt, test]);

  // ── Timer ──
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const t = prev - 1;
        if (t === 300 && !hasWarned5.current) {
          warning("⚠️ 5 minutes remaining!");
          hasWarned5.current = true;
        }
        if (t === 60 && !hasWarned1.current) {
          warning("🚨 Only 1 minute left!");
          hasWarned1.current = true;
        }
        if (t <= 0) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return t;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // ── Auto save every 30s ──
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      doAutoSave();
    }, 30000);
    return () => clearInterval(autoSaveRef.current);
  }, [responses, currentIndex]);

  const doAutoSave = useCallback(async () => {
    setAutoSaving(true);
    try {
      const q = questions[currentIndex];
      if (q && responses[q._id] !== undefined) {
        await testService.saveAnswer({
          attemptId,
          questionId: q._id,
          selectedAnswer: responses[q._id] || "",
          isMarkedForReview: markedForReview[q._id] || false,
        });
      }
    } catch {}
    finally {
      setTimeout(() => setAutoSaving(false), 1000);
    }
  }, [currentIndex, responses, markedForReview, attemptId, questions]);

  const handleAnswerChange = (questionId, answer) => {
    setResponses((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleMarkForReview = (questionId) => {
    setMarkedForReview((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleClearResponse = (questionId) => {
    setResponses((prev) => ({ ...prev, [questionId]: "" }));
  };

  const handleAutoSubmit = async () => {
    warning("⏰ Time's up! Auto-submitting...");
    await handleSubmit();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    clearInterval(timerRef.current);
    clearInterval(autoSaveRef.current);

    try {
      const timeTaken = test?.duration * 60 - timeLeft;
      const responsesArray = Object.entries(responses).map(
        ([questionId, selectedAnswer]) => ({ questionId, selectedAnswer })
      );

      await testService.submit({ attemptId, timeTaken, responses: responsesArray });

      // Stop proctoring and camera
      window.dispatchEvent(new Event("smartprep-stop-proctoring"));

      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }

      success("Test submitted successfully! 🎉");

      // Small delay to ensure camera stops
      setTimeout(() => {
        navigate(`/result/${attemptId}`, { replace: true });
      }, 500);
    } catch (err) {
      toastError(err.response?.data?.message || "Submission failed");
      setSubmitting(false);
    }
  };

  const handleReEnterFullscreen = async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
    } catch {
      toastError("Could not enable fullscreen");
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getStatus = (index) => {
    const q = questions[index];
    if (!q) return "unanswered";
    if (markedForReview[q._id]) return "review";
    if (responses[q._id]?.trim()) return "answered";
    return "unanswered";
  };

  const statusStyle = {
    answered: { bg: "#16a34a", text: "white" },
    review: { bg: "#d97706", text: "white" },
    unanswered: { bg: "#f1f5f9", text: "#374151" },
  };

  const currentQ = questions[currentIndex];
  const answeredCount = questions.filter(
    (q) => responses[q._id]?.trim()
  ).length;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;
  const timerDanger = timeLeft < 300;

  if (!attempt || !test || questions.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f8fafc",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 48 }}>❌</div>
        <p style={{ color: "#374151", fontSize: 16 }}>Invalid exam session</p>
        <button
          onClick={() => navigate("/my-tests")}
          className="btn-primary"
        >
          Back to Tests
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Fullscreen Warning Banner ── */}
      <AnimatePresence>
        {!isFullscreen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              backgroundColor: "#fef2f2",
              borderBottom: "2px solid #fecaca",
              padding: "10px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
              overflow: "hidden",
            }}
          >
            <p
              style={{
                color: "#dc2626",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              ⚠️ Fullscreen mode is required. This violation has been recorded.
            </p>
            <button
              onClick={handleReEnterFullscreen}
              style={{
                padding: "6px 16px",
                backgroundColor: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "inherit",
              }}
            >
              🖥️ Re-enter Fullscreen
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top Bar ── */}
      <div
        style={{
          backgroundColor: "white",
          borderBottom: "1px solid #f1f5f9",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          flexWrap: "wrap",
          gap: 10,
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        {/* Test Info */}
        <div>
          <h1
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#0f172a",
              letterSpacing: "-0.01em",
            }}
          >
            {test?.title}
          </h1>
          <p style={{ fontSize: 12, color: "#64748b" }}>
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          {[
            { color: "#16a34a", label: `Answered (${answeredCount})` },
            { color: "#d97706", label: `Review (${reviewCount})` },
            {
              color: "#f1f5f9",
              border: "#e2e8f0",
              label: `Unanswered (${questions.length - answeredCount})`,
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "#64748b",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  backgroundColor: item.color,
                  border: item.border ? `1px solid ${item.border}` : "none",
                }}
              />
              {item.label}
            </div>
          ))}
        </div>

        {/* Right Side */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {autoSaving && (
            <span style={{ fontSize: 11, color: "#94a3b8" }}>💾 Saving...</span>
          )}

          {!isFullscreen && (
            <button
              onClick={handleReEnterFullscreen}
              style={{
                padding: "5px 12px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 12,
                color: "#dc2626",
                fontWeight: 600,
                fontFamily: "inherit",
              }}
            >
              🖥️ Fullscreen
            </button>
          )}

          {/* Timer */}
          <div
            style={{
              backgroundColor: timerDanger ? "#fef2f2" : "#f8fafc",
              border: `1.5px solid ${timerDanger ? "#fecaca" : "#e2e8f0"}`,
              borderRadius: 10,
              padding: "7px 14px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 15 }}>
              {timerDanger ? "🚨" : "⏱️"}
            </span>
            <span
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: timerDanger ? "#dc2626" : "#0f172a",
                fontFamily: "monospace",
                letterSpacing: "0.05em",
              }}
            >
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Submit */}
          <button
            onClick={() => setShowSubmitDialog(true)}
            disabled={submitting}
            className="btn-primary"
            style={{ fontSize: 13, padding: "8px 16px" }}
          >
            {submitting ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          maxWidth: 1180,
          margin: "0 auto",
          width: "100%",
          padding: "20px 16px",
          gap: 16,
        }}
      >
        {/* Question Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {currentQ && (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="card"
              style={{ marginBottom: 14 }}
            >
              {/* Question Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 20,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      color: "white",
                      fontSize: 13,
                    }}
                  >
                    {currentIndex + 1}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#94a3b8",
                      textTransform: "capitalize",
                      backgroundColor: "#f8fafc",
                      padding: "3px 10px",
                      borderRadius: 99,
                    }}
                  >
                    {currentQ.questionType} · {currentQ.difficulty}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleMarkForReview(currentQ._id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: `1.5px solid ${
                        markedForReview[currentQ._id] ? "#d97706" : "#e2e8f0"
                      }`,
                      backgroundColor: markedForReview[currentQ._id]
                        ? "#fffbeb"
                        : "white",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                      color: markedForReview[currentQ._id]
                        ? "#d97706"
                        : "#64748b",
                      fontFamily: "inherit",
                    }}
                  >
                    {markedForReview[currentQ._id]
                      ? "🔖 Marked"
                      : "🔖 Mark"}
                  </button>
                  <button
                    onClick={() => handleClearResponse(currentQ._id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "1.5px solid #e2e8f0",
                      backgroundColor: "white",
                      cursor: "pointer",
                      fontSize: 12,
                      color: "#64748b",
                      fontFamily: "inherit",
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#0f172a",
                  lineHeight: 1.7,
                  marginBottom: 24,
                  letterSpacing: "-0.01em",
                }}
              >
                {currentQ.question}
              </p>

              {/* MCQ Options */}
              {currentQ.questionType === "mcq" &&
                currentQ.options?.length > 0 && (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 10 }}
                  >
                    {currentQ.options.map((option, i) => {
                      const isSelected = responses[currentQ._id] === option;
                      return (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.005 }}
                          whileTap={{ scale: 0.995 }}
                          onClick={() =>
                            handleAnswerChange(currentQ._id, option)
                          }
                          style={{
                            padding: "13px 16px",
                            borderRadius: 12,
                            border: `2px solid ${
                              isSelected ? "#6366f1" : "#e2e8f0"
                            }`,
                            backgroundColor: isSelected ? "#eef2ff" : "white",
                            cursor: "pointer",
                            textAlign: "left",
                            fontSize: 14,
                            color: isSelected ? "#4338ca" : "#374151",
                            fontWeight: isSelected ? 600 : 400,
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            fontFamily: "inherit",
                            transition: "all 0.15s",
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              backgroundColor: isSelected
                                ? "#6366f1"
                                : "#f1f5f9",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: 800,
                              color: isSelected ? "white" : "#64748b",
                              flexShrink: 0,
                            }}
                          >
                            {String.fromCharCode(65 + i)}
                          </div>
                          {option}
                        </motion.button>
                      );
                    })}
                  </div>
                )}

              {/* True/False */}
              {currentQ.questionType === "truefalse" && (
                <div style={{ display: "flex", gap: 12 }}>
                  {["True", "False"].map((opt) => {
                    const isSelected = responses[currentQ._id] === opt;
                    return (
                      <motion.button
                        key={opt}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() =>
                          handleAnswerChange(currentQ._id, opt)
                        }
                        style={{
                          flex: 1,
                          padding: 16,
                          borderRadius: 12,
                          border: `2px solid ${
                            isSelected ? "#6366f1" : "#e2e8f0"
                          }`,
                          backgroundColor: isSelected ? "#eef2ff" : "white",
                          cursor: "pointer",
                          fontSize: 15,
                          fontWeight: 700,
                          color: isSelected ? "#4338ca" : "#374151",
                          fontFamily: "inherit",
                        }}
                      >
                        {opt === "True" ? "✅ True" : "❌ False"}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Text Answer */}
              {["fillinblanks", "shortanswer", "longanswer", "viva"].includes(
                currentQ.questionType
              ) && (
                <textarea
                  value={responses[currentQ._id] || ""}
                  onChange={(e) =>
                    handleAnswerChange(currentQ._id, e.target.value)
                  }
                  placeholder="Type your answer here..."
                  rows={
                    currentQ.questionType === "longanswer" ||
                    currentQ.questionType === "viva"
                      ? 6
                      : 3
                  }
                  className="form-input"
                  style={{ resize: "vertical", marginTop: 4 }}
                />
              )}
            </motion.div>
          )}

          {/* Navigation */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
            }}
          >
            <button
              onClick={() =>
                setCurrentIndex((i) => Math.max(0, i - 1))
              }
              disabled={currentIndex === 0}
              className="btn-secondary"
              style={{
                opacity: currentIndex === 0 ? 0.4 : 1,
                fontSize: 14,
              }}
            >
              ← Previous
            </button>

            <button
              onClick={doAutoSave}
              className="btn-ghost"
              style={{ fontSize: 13 }}
            >
              💾 Save
            </button>

            <button
              onClick={() =>
                setCurrentIndex((i) =>
                  Math.min(questions.length - 1, i + 1)
                )
              }
              disabled={currentIndex === questions.length - 1}
              className="btn-primary"
              style={{
                opacity:
                  currentIndex === questions.length - 1 ? 0.4 : 1,
                fontSize: 14,
              }}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Question Palette */}
        <div style={{ width: 210, flexShrink: 0 }}>
          <div
            className="card"
            style={{
              position: "sticky",
              top: 80,
              padding: "1rem",
            }}
          >
            <h3
              style={{
                fontWeight: 700,
                color: "#0f172a",
                fontSize: 13,
                marginBottom: 12,
                letterSpacing: "-0.01em",
              }}
            >
              Question Palette
            </h3>

            {/* Progress */}
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: "#64748b",
                  marginBottom: 5,
                }}
              >
                <span>Progress</span>
                <span>
                  {answeredCount}/{questions.length}
                </span>
              </div>
              <div
                style={{
                  height: 5,
                  backgroundColor: "#f1f5f9",
                  borderRadius: 99,
                  overflow: "hidden",
                }}
              >
                <motion.div
                  animate={{
                    width: `${(answeredCount / questions.length) * 100}%`,
                  }}
                  style={{
                    height: "100%",
                    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                    borderRadius: 99,
                  }}
                />
              </div>
            </div>

            {/* Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 5,
                marginBottom: 14,
              }}
            >
              {questions.map((q, index) => {
                const st = getStatus(index);
                const sc = statusStyle[st];
                const isCurrent = index === currentIndex;
                return (
                  <motion.button
                    key={q._id}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setCurrentIndex(index)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 7,
                      border: isCurrent
                        ? "2px solid #6366f1"
                        : "1px solid transparent",
                      backgroundColor: sc.bg,
                      color: sc.text,
                      cursor: "pointer",
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: "inherit",
                      boxShadow: isCurrent
                        ? "0 0 0 2px rgba(99,102,241,0.2)"
                        : "none",
                    }}
                  >
                    {index + 1}
                  </motion.button>
                );
              })}
            </div>

            {/* Legend */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: 6 }}
            >
              {[
                { color: "#16a34a", label: "Answered" },
                { color: "#d97706", label: "For Review" },
                { color: "#f1f5f9", label: "Unanswered", border: "#e2e8f0" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: 3,
                      backgroundColor: item.color,
                      border: item.border
                        ? `1px solid ${item.border}`
                        : "none",
                    }}
                  />
                  <span style={{ fontSize: 11, color: "#64748b" }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Proctoring Monitor */}
      <ProctoringMonitor
        attemptId={attempt?._id}
        testId={test?._id}
        enabled={true}
      />

      {/* Submit Dialog */}
      <ConfirmDialog
        isOpen={showSubmitDialog}
        onClose={() => setShowSubmitDialog(false)}
        onConfirm={() => {
          setShowSubmitDialog(false);
          handleSubmit();
        }}
        title="Submit Test"
        message={`You have answered ${answeredCount} of ${questions.length} questions. ${
          questions.length - answeredCount
        } questions are unanswered. Are you sure you want to submit?`}
        confirmText="Submit Test"
        cancelText="Continue"
        loading={submitting}
      />
    </div>
  );
};

export default ExamInterface;