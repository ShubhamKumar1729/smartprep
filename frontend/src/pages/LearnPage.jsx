import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import smartService from "../services/smartService.js";
import useToast from "../hooks/useToast.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";

const actionConfig = {
  summary: {
    title: "Summary",
    emoji: "📖",
    color: "#6366f1",
    bg: "#eef2ff",
    border: "#c7d2fe",
  },
  notes: {
    title: "Notes",
    emoji: "📝",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
  },
  flashcards: {
    title: "Flashcards",
    emoji: "🎴",
    color: "#8b5cf6",
    bg: "#faf5ff",
    border: "#e9d5ff",
  },
  test: {
    title: "Test Me",
    emoji: "🧠",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
  },
};

const LearnPage = () => {
  const { action } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { error: toastError, success, info } = useToast();

  const fileIds = location.state?.fileIds || [];
  const config = actionConfig[action] || actionConfig.summary;

  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(null);

  // Options
  const [summaryType, setSummaryType] = useState("short");
  const [noteType, setNoteType] = useState("quick");
  const [questionType, setQuestionType] = useState("mcq");
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState("mixed");

  // Flashcard state
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (fileIds.length === 0) navigate("/home");
  }, [fileIds]);

  const handleGenerate = async () => {
    setLoading(true);
    setContent(null);
    setCardIndex(0);
    setFlipped(false);

    try {
      info("Processing files...");
      let res;

      switch (action) {
        case "summary":
          res = await smartService.getSummary(fileIds, summaryType);
          setContent(res.data.summary);
          break;
        case "notes":
          res = await smartService.getNotes(fileIds, noteType);
          setContent(res.data.notes);
          break;
        case "flashcards":
          res = await smartService.getFlashcards(fileIds);
          setContent(res.data);
          break;
        default:
          break;
      }

      success("Generated successfully! ✨");
    } catch (err) {
      toastError(
        err.response?.data?.message || "Generation failed. Make sure files have readable text."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartProctoredTest = async () => {
    setLoading(true);

    try {
      const toastId = info("Processing files and creating test...");
      const res = await smartService.createTest(
        fileIds,
        questionType,
        questionCount,
        difficulty,
        `Quick Test — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      );

      success(
        `Test created with ${res.data.questionCount} questions! 🎉`
      );

      setTimeout(() => {
        navigate(`/exam/environment-check/${res.data.testId}`);
      }, 800);
    } catch (err) {
      toastError(
        err.response?.data?.message || "Failed to create test. Please try again."
      );
      setLoading(false);
    }
  };

  const summaryTypes = [
    { value: "short", label: "⚡ Short", desc: "100-200 words" },
    { value: "detailed", label: "📖 Detailed", desc: "500+ words" },
    { value: "chapterwise", label: "📚 Chapter-wise", desc: "Per chapter" },
    { value: "topicwise", label: "📌 Topic-wise", desc: "Per topic" },
  ];

  const noteTypes = [
    { value: "quick", label: "⚡ Quick", desc: "Bullet points" },
    { value: "detailed", label: "📖 Detailed", desc: "Full notes" },
    { value: "revision", label: "🔄 Revision", desc: "Ultra short" },
    { value: "formula", label: "🧮 Formula", desc: "Formula sheet" },
  ];

  return (
    <div
      style={{
        maxWidth: 820,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}
      >
        <button
          onClick={() => navigate("/home")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#6366f1",
            fontSize: 13,
            fontWeight: 600,
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontFamily: "inherit",
          }}
        >
          ← Back
        </button>
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {config.emoji} {config.title}
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
            {fileIds.length} file{fileIds.length > 1 ? "s" : ""} selected
          </p>
        </div>
      </motion.div>

      {/* Options Panel */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        {/* Summary Options */}
        {action === "summary" && (
          <div style={{ marginBottom: 16 }}>
            <p
              style={{
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: 12,
                fontSize: 14,
              }}
            >
              Choose summary type
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 10,
              }}
            >
              {summaryTypes.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSummaryType(opt.value)}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: `2px solid ${summaryType === opt.value ? "#6366f1" : "#e2e8f0"}`,
                    backgroundColor:
                      summaryType === opt.value ? "#eef2ff" : "white",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                    fontFamily: "inherit",
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color:
                        summaryType === opt.value ? "#4338ca" : "#374151",
                    }}
                  >
                    {opt.label}
                  </p>
                  <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes Options */}
        {action === "notes" && (
          <div style={{ marginBottom: 16 }}>
            <p
              style={{
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: 12,
                fontSize: 14,
              }}
            >
              Choose notes type
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 10,
              }}
            >
              {noteTypes.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setNoteType(opt.value)}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: `2px solid ${noteType === opt.value ? "#16a34a" : "#e2e8f0"}`,
                    backgroundColor:
                      noteType === opt.value ? "#f0fdf4" : "white",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                    fontFamily: "inherit",
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: noteType === opt.value ? "#15803d" : "#374151",
                    }}
                  >
                    {opt.label}
                  </p>
                  <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Test Options */}
        {action === "test" && (
          <div>
            {/* Proctoring Notice */}
            <div
              style={{
                backgroundColor: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 12,
                padding: 14,
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>🛡️</span>
              <div>
                <p
                  style={{
                    fontWeight: 700,
                    color: "#92400e",
                    fontSize: 14,
                    marginBottom: 4,
                  }}
                >
                  Proctored Examination
                </p>
                <p style={{ color: "#78350f", fontSize: 13, lineHeight: 1.6 }}>
                  This test includes environment verification — camera,
                  microphone, and face detection. The exam runs in mandatory
                  fullscreen mode with AI monitoring.
                </p>
              </div>
            </div>

            <p
              style={{
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: 12,
                fontSize: 14,
              }}
            >
              Configure your test
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}
                >
                  Question Type
                </label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  className="form-input"
                  style={{ fontSize: 13 }}
                >
                  <option value="mcq">🔘 MCQ</option>
                  <option value="truefalse">✅ True/False</option>
                  <option value="fillinblanks">📝 Fill in Blanks</option>
                  <option value="shortanswer">💬 Short Answer</option>
                  <option value="viva">🎤 Viva Questions</option>
                  <option value="mixed">🔀 Mixed</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}
                >
                  Number of Questions
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="form-input"
                  style={{ fontSize: 13 }}
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                  <option value={20}>20 Questions</option>
                  <option value={30}>30 Questions</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}
                >
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="form-input"
                  style={{ fontSize: 13 }}
                >
                  <option value="mixed">🔀 Mixed</option>
                  <option value="easy">🟢 Easy</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="hard">🔴 Hard</option>
                </select>
              </div>
            </div>

            {/* Steps */}
            <div
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: 12,
                padding: 14,
                marginBottom: 20,
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#374151",
                  marginBottom: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                What happens next
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {[
                  { n: 1, text: "Files are processed and questions generated", emoji: "⚙️" },
                  { n: 2, text: "Camera, microphone and face verification", emoji: "🛡️" },
                  { n: 3, text: "Exam starts in fullscreen with AI monitoring", emoji: "📋" },
                  { n: 4, text: "Results and proctoring report on completion", emoji: "📊" },
                ].map((step) => (
                  <div
                    key={step.n}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        backgroundColor: "#eef2ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#4338ca",
                        flexShrink: 0,
                      }}
                    >
                      {step.n}
                    </div>
                    <span style={{ fontSize: 14 }}>{step.emoji}</span>
                    <p style={{ fontSize: 13, color: "#374151" }}>
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        {action === "test" ? (
          <button
            onClick={handleStartProctoredTest}
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%" }}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                Creating test...
              </>
            ) : (
              "🚀 Create Test & Start Verification"
            )}
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%" }}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                Generating...
              </>
            ) : (
              `✨ Generate ${config.title}`
            )}
          </button>
        )}
      </motion.div>

      {/* ── Content Display ── */}
      <AnimatePresence>
        {content && action !== "test" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {/* Summary */}
            {action === "summary" && (
              <div className="card">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                  }}
                >
                  <h3
                    style={{
                      fontWeight: 700,
                      color: "#0f172a",
                      fontSize: 15,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    📖 Summary
                  </h3>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>
                    {content.wordCount} words
                  </span>
                </div>

                {content.chapters?.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {content.chapters.map((ch, i) => (
                      <div
                        key={i}
                        style={{
                          backgroundColor: "#f8fafc",
                          borderRadius: 10,
                          padding: 16,
                          borderLeft: "3px solid #6366f1",
                        }}
                      >
                        <h4
                          style={{
                            fontWeight: 700,
                            color: "#4338ca",
                            fontSize: 14,
                            marginBottom: 8,
                          }}
                        >
                          {ch.title}
                        </h4>
                        <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8 }}>
                          {ch.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : content.topics?.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {content.topics.map((t, i) => (
                      <div
                        key={i}
                        style={{
                          backgroundColor: "#f8fafc",
                          borderRadius: 10,
                          padding: 16,
                          borderLeft: "3px solid #8b5cf6",
                        }}
                      >
                        <h4
                          style={{
                            fontWeight: 700,
                            color: "#7c3aed",
                            fontSize: 14,
                            marginBottom: 8,
                          }}
                        >
                          {t.title}
                        </h4>
                        <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8 }}>
                          {t.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      backgroundColor: "#f8fafc",
                      borderRadius: 12,
                      padding: 20,
                      fontSize: 14,
                      color: "#374151",
                      lineHeight: 1.9,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {content.content}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {action === "notes" && (
              <div className="card">
                <h3
                  style={{
                    fontWeight: 700,
                    color: "#0f172a",
                    fontSize: 15,
                    marginBottom: 16,
                  }}
                >
                  📝 Notes
                </h3>

                {content.bulletPoints?.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {content.bulletPoints.map((point, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        style={{
                          display: "flex",
                          gap: 12,
                          padding: "12px 14px",
                          backgroundColor: "#f8fafc",
                          borderRadius: 10,
                          alignItems: "flex-start",
                        }}
                      >
                        <span
                          style={{
                            color: "#16a34a",
                            fontWeight: 800,
                            flexShrink: 0,
                            fontSize: 18,
                            lineHeight: 1.4,
                          }}
                        >
                          •
                        </span>
                        <span
                          style={{
                            fontSize: 14,
                            color: "#374151",
                            lineHeight: 1.7,
                          }}
                        >
                          {point}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ) : content.formulas?.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {content.formulas.map((f, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "10px 16px",
                          backgroundColor: "#fffbeb",
                          borderRadius: 10,
                          fontFamily: "monospace",
                          fontSize: 14,
                          color: "#92400e",
                          border: "1px solid #fde68a",
                        }}
                      >
                        {f.formula || f}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      backgroundColor: "#f8fafc",
                      borderRadius: 12,
                      padding: 20,
                      fontSize: 14,
                      color: "#374151",
                      lineHeight: 1.9,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {content.content}
                  </div>
                )}
              </div>
            )}

            {/* Flashcards */}
            {action === "flashcards" && content.flashcards && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <h3
                    style={{
                      fontWeight: 700,
                      color: "#0f172a",
                      fontSize: 15,
                    }}
                  >
                    🎴 Flashcards ({content.total})
                  </h3>
                  <span style={{ fontSize: 13, color: "#64748b" }}>
                    {cardIndex + 1} / {content.flashcards.length}
                  </span>
                </div>

                {/* Progress */}
                <div
                  style={{
                    height: 6,
                    backgroundColor: "#f1f5f9",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    animate={{
                      width: `${((cardIndex + 1) / content.flashcards.length) * 100}%`,
                    }}
                    transition={{ duration: 0.3 }}
                    style={{
                      height: "100%",
                      background: "linear-gradient(90deg, #8b5cf6, #6366f1)",
                      borderRadius: 999,
                    }}
                  />
                </div>

                {/* Card */}
                <motion.div
                  key={`${cardIndex}-${flipped}`}
                  initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setFlipped(!flipped)}
                  style={{
                    minHeight: 240,
                    borderRadius: 20,
                    border: `2px solid ${flipped ? "#334155" : "#e9d5ff"}`,
                    backgroundColor: flipped ? "#1e293b" : "#faf5ff",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2.5rem 2rem",
                    textAlign: "center",
                    boxShadow: flipped
                      ? "0 8px 30px rgba(15,23,42,0.3)"
                      : "0 8px 30px rgba(139,92,246,0.1)",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: flipped
                        ? "rgba(255,255,255,0.35)"
                        : "#94a3b8",
                      marginBottom: 20,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    {flipped ? "Answer" : "Question"} · Click to flip
                  </span>
                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: flipped ? 400 : 700,
                      color: flipped ? "#e2e8f0" : "#0f172a",
                      lineHeight: 1.7,
                      maxWidth: 500,
                    }}
                  >
                    {flipped
                      ? content.flashcards[cardIndex]?.answer
                      : content.flashcards[cardIndex]?.question}
                  </p>
                </motion.div>

                {/* Navigation */}
                <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
                  <button
                    onClick={() => {
                      setFlipped(false);
                      setCardIndex((i) => Math.max(0, i - 1));
                    }}
                    disabled={cardIndex === 0}
                    className="btn-secondary"
                    style={{ opacity: cardIndex === 0 ? 0.4 : 1 }}
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => setFlipped(!flipped)}
                    style={{
                      padding: "0.75rem 1.25rem",
                      borderRadius: 12,
                      border: "1.5px solid #8b5cf6",
                      backgroundColor: "#faf5ff",
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#7c3aed",
                      fontFamily: "inherit",
                    }}
                  >
                    🔄 Flip
                  </button>
                  <button
                    onClick={() => {
                      setFlipped(false);
                      setCardIndex((i) =>
                        Math.min(content.flashcards.length - 1, i + 1)
                      );
                    }}
                    disabled={cardIndex === content.flashcards.length - 1}
                    className="btn-primary"
                    style={{
                      opacity:
                        cardIndex === content.flashcards.length - 1 ? 0.4 : 1,
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LearnPage;