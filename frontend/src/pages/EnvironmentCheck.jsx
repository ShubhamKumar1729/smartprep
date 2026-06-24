import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import testService from "../services/testService.js";
import environmentService from "../services/environmentService.js";
import useToast from "../hooks/useToast.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";

const STATUS = {
  PENDING: "pending",
  CHECKING: "checking",
  PASSED: "passed",
  FAILED: "failed",
};

const initialChecks = {
  permissions: STATUS.PENDING,
  camera: STATUS.PENDING,
  microphone: STATUS.PENDING,
  face: STATUS.PENDING,
  singleFace: STATUS.PENDING,
  fullscreen: STATUS.PENDING,
};

const EnvironmentCheck = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { error: toastError, success, warning } = useToast();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const faceApiRef = useRef(null);
  const faceIntervalRef = useRef(null);
  const audioCtxRef = useRef(null);

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState(initialChecks);
  const [messages, setMessages] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [modelError, setModelError] = useState(false);

  useEffect(() => {
    testService
      .getById(testId)
      .then((res) => setTest(res.data.test))
      .catch(() => {
        toastError("Test not found");
        navigate("/my-tests");
      })
      .finally(() => setLoading(false));

    return () => stopEverything();
  }, [testId]);

  const updateCheck = useCallback((key, status, message = "") => {
    setChecks((prev) => ({ ...prev, [key]: status }));
    if (message) setMessages((prev) => ({ ...prev, [key]: message }));
  }, []);

  const stopEverything = useCallback(() => {
    if (faceIntervalRef.current) {
      clearInterval(faceIntervalRef.current);
      faceIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const checkPermissions = async () => {
    updateCheck("permissions", STATUS.CHECKING, "Checking permissions...");
    try {
      if (navigator.permissions) {
        const cam = await navigator.permissions
          .query({ name: "camera" })
          .catch(() => ({ state: "unknown" }));
        const mic = await navigator.permissions
          .query({ name: "microphone" })
          .catch(() => ({ state: "unknown" }));

        if (cam.state === "denied" || mic.state === "denied") {
          updateCheck(
            "permissions",
            STATUS.FAILED,
            "Permission denied. Allow camera & microphone in browser settings."
          );
          return false;
        }
      }
      updateCheck("permissions", STATUS.PASSED, "Permissions available ✓");
      return true;
    } catch {
      updateCheck("permissions", STATUS.PASSED, "Permissions will be requested");
      return true;
    }
  };

  const startCamera = async () => {
    updateCheck("camera", STATUS.CHECKING, "Starting camera...");
    updateCheck("microphone", STATUS.CHECKING, "Starting microphone...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve, reject) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().then(resolve).catch(reject);
          };
          videoRef.current.onerror = reject;
          setTimeout(reject, 10000);
        });
        setCameraActive(true);
      }

      updateCheck("camera", STATUS.PASSED, "Camera active ✓");
      updateCheck("microphone", STATUS.PASSED, "Microphone connected ✓");

      startAudioMonitor(stream);
      return true;
    } catch (err) {
      let msg = "Camera access failed.";
      if (err.name === "NotAllowedError") {
        msg = "Permission denied. Click the camera icon in address bar and allow access.";
        updateCheck("permissions", STATUS.FAILED, msg);
      } else if (err.name === "NotFoundError") {
        msg = "No camera found. Please connect a camera.";
      } else if (err.name === "NotReadableError") {
        msg = "Camera is in use by another app. Close it and try again.";
      }

      updateCheck("camera", STATUS.FAILED, msg);
      updateCheck("microphone", STATUS.FAILED, "Microphone unavailable");
      return false;
    }
  };

  const startAudioMonitor = (stream) => {
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioCtxRef.current = ctx;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const update = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((s, v) => s + v, 0) / data.length;
        setAudioLevel(Math.round(avg));
        requestAnimationFrame(update);
      };
      update();
    } catch {}
  };

  const loadFaceModels = async () => {
    updateCheck("face", STATUS.CHECKING, "Loading face detection AI...");
    try {
      const faceapi = await import("face-api.js");
      faceApiRef.current = faceapi;
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      setModelError(false);
      return true;
    } catch (err) {
      console.error("Face models failed:", err);
      setModelError(true);
      updateCheck(
        "face",
        STATUS.FAILED,
        "Face detection models not found. Please download model files to /public/models/"
      );
      updateCheck("singleFace", STATUS.FAILED, "Cannot verify — models missing");
      return false;
    }
  };

  const detectFace = async () => {
    if (!faceApiRef.current || !videoRef.current) {
      updateCheck("face", STATUS.FAILED, "Face detection unavailable");
      updateCheck("singleFace", STATUS.FAILED, "Cannot verify");
      return false;
    }

    updateCheck("face", STATUS.CHECKING, "Looking for your face...");
    updateCheck("singleFace", STATUS.CHECKING, "Checking for single candidate...");

    await new Promise((r) => setTimeout(r, 2000));

    const faceapi = faceApiRef.current;
    const video = videoRef.current;
    let attempts = 0;
    const max = 8;

    while (attempts < max) {
      try {
        if (video.paused || video.ended) await video.play().catch(() => {});
        if (video.readyState < 2 || video.videoWidth === 0) {
          await new Promise((r) => setTimeout(r, 1000));
          attempts++;
          continue;
        }

        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.3,
          })
        );

        setFaceCount(detections.length);

        if (detections.length === 0) {
          if (attempts < max - 1) {
            updateCheck(
              "face",
              STATUS.CHECKING,
              `No face detected (attempt ${attempts + 1}/${max}). Look directly at camera...`
            );
            await new Promise((r) => setTimeout(r, 2000));
            attempts++;
            continue;
          }
          updateCheck(
            "face",
            STATUS.FAILED,
            "No face detected. Ensure good lighting and look at the camera directly."
          );
          updateCheck("singleFace", STATUS.FAILED, "Could not verify candidate");
          return false;
        } else if (detections.length > 1) {
          updateCheck(
            "face",
            STATUS.FAILED,
            `${detections.length} faces detected. Only one candidate is allowed.`
          );
          updateCheck(
            "singleFace",
            STATUS.FAILED,
            "Multiple faces detected. Ensure only you are visible."
          );
          return false;
        } else {
          updateCheck(
            "face",
            STATUS.PASSED,
            `Face detected (${Math.round(detections[0].score * 100)}% confidence) ✓`
          );
          updateCheck("singleFace", STATUS.PASSED, "Single candidate verified ✓");

          // Continuous monitoring
          faceIntervalRef.current = setInterval(async () => {
            try {
              if (!videoRef.current || videoRef.current.readyState < 2) return;
              const d = await faceapi.detectAllFaces(
                videoRef.current,
                new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 })
              );
              setFaceCount(d.length);
            } catch {}
          }, 2500);

          return true;
        }
      } catch {
        attempts++;
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    updateCheck("face", STATUS.FAILED, "Face detection failed. Please refresh and try again.");
    updateCheck("singleFace", STATUS.FAILED, "Verification failed");
    return false;
  };

  const checkFullscreen = async () => {
    updateCheck("fullscreen", STATUS.CHECKING, "Checking fullscreen...");

    const isFS =
      !!document.fullscreenElement ||
      !!document.webkitFullscreenElement ||
      !!document.mozFullScreenElement;

    if (isFS) {
      updateCheck("fullscreen", STATUS.PASSED, "Fullscreen active ✓");
      return true;
    } else {
      updateCheck("fullscreen", STATUS.FAILED, "Fullscreen required. Click the button below.");
      return false;
    }
  };

  const enableFullscreen = async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();

      await new Promise((r) => setTimeout(r, 500));
      updateCheck("fullscreen", STATUS.PASSED, "Fullscreen active ✓");
    } catch {
      updateCheck(
        "fullscreen",
        STATUS.FAILED,
        "Could not enable fullscreen. Press F11 on keyboard."
      );
    }
  };

  const runAllChecks = async () => {
    setIsRunning(true);
    setChecks(initialChecks);
    setMessages({});
    setFaceCount(0);
    stopEverything();

    await new Promise((r) => setTimeout(r, 300));

    await checkPermissions();
    await new Promise((r) => setTimeout(r, 400));

    const camOk = await startCamera();
    await new Promise((r) => setTimeout(r, 500));

    if (!camOk) { setIsRunning(false); return; }

    const modelsOk = await loadFaceModels();
    await new Promise((r) => setTimeout(r, 400));

    if (modelsOk) await detectFace();
    await new Promise((r) => setTimeout(r, 400));

    await checkFullscreen();
    setIsRunning(false);
  };

  const handleStartExam = async () => {
    setIsStarting(true);

    try {
      await environmentService
        .save({
          testId,
          cameraStatus: checks.camera,
          microphoneStatus: checks.microphone,
          faceStatus: checks.face,
          singleFaceStatus: checks.singleFace,
          fullscreenStatus: checks.fullscreen,
          permissionStatus: checks.permissions,
        })
        .catch(() => {});

      const isFS =
        !!document.fullscreenElement || !!document.webkitFullscreenElement;
      if (!isFS) await enableFullscreen();

      stopEverything();

      const res = await testService.start({ testId });
      success("Environment verified! Starting exam...");

      setTimeout(() => {
        navigate(`/exam/${res.data.attempt._id}`, {
          state: {
            attempt: res.data.attempt,
            test: res.data.test,
            questions: res.data.questions,
            savedResponses: res.data.savedResponses || [],
            isResumed: res.data.isResumed,
          },
        });
      }, 600);
    } catch (err) {
      toastError(err.response?.data?.message || "Failed to start exam");
      setIsStarting(false);
    }
  };

  const allPassed =
    checks.permissions === STATUS.PASSED &&
    checks.camera === STATUS.PASSED &&
    checks.microphone === STATUS.PASSED &&
    checks.face === STATUS.PASSED &&
    checks.singleFace === STATUS.PASSED &&
    checks.fullscreen === STATUS.PASSED;

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#0f172a",
        }}
      >
        <LoadingSpinner size="lg" color="white" />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 16px",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          textAlign: "center",
          marginBottom: 28,
          maxWidth: 760,
          width: "100%",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#1e293b",
            borderRadius: 10,
            padding: "6px 16px",
            marginBottom: 16,
            border: "1px solid #334155",
          }}
        >
          <span style={{ fontSize: 14 }}>🛡️</span>
          <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>
            Pre-Exam Environment Verification
          </span>
        </div>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "white",
            marginBottom: 6,
            letterSpacing: "-0.02em",
          }}
        >
          {test?.title}
        </h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          {test?.questionCount} Questions · {test?.duration} Minutes ·{" "}
          <span style={{ textTransform: "capitalize" }}>{test?.difficulty}</span>
        </p>
      </motion.div>

      {/* Main Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
          maxWidth: 860,
          width: "100%",
        }}
      >
        {/* Camera Preview */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            backgroundColor: "#1e293b",
            borderRadius: 18,
            overflow: "hidden",
            border: "1px solid #334155",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <p style={{ color: "white", fontWeight: 700, fontSize: 13 }}>
              📷 Camera Preview
            </p>
            {cameraActive && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#ef4444",
                    animation: "pulse 1s infinite",
                  }}
                />
                <span style={{ color: "#ef4444", fontSize: 10, fontWeight: 700 }}>
                  LIVE
                </span>
              </div>
            )}
          </div>

          <div style={{ position: "relative", backgroundColor: "#020617" }}>
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              style={{
                width: "100%",
                height: 240,
                objectFit: "cover",
                display: cameraActive ? "block" : "none",
              }}
            />
            {!cameraActive && (
              <div
                style={{
                  width: "100%",
                  height: 240,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 40 }}>📷</span>
                <p style={{ color: "#475569", fontSize: 13 }}>
                  Camera preview will appear here
                </p>
              </div>
            )}

            {cameraActive && (
              <div
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: 10,
                  backgroundColor: "rgba(0,0,0,0.75)",
                  borderRadius: 8,
                  padding: "4px 12px",
                }}
              >
                <span
                  style={{
                    color:
                      faceCount === 1
                        ? "#22c55e"
                        : faceCount === 0
                        ? "#ef4444"
                        : "#f59e0b",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {faceCount === 0
                    ? "👤 No face detected"
                    : faceCount === 1
                    ? "✅ Face verified"
                    : `⚠️ ${faceCount} faces detected`}
                </span>
              </div>
            )}
          </div>

          {cameraActive && (
            <div style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#64748b", fontSize: 12 }}>🎤</span>
                <div
                  style={{
                    flex: 1,
                    height: 5,
                    backgroundColor: "#334155",
                    borderRadius: 99,
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    animate={{ width: `${Math.min(100, audioLevel * 2)}%` }}
                    style={{
                      height: "100%",
                      backgroundColor:
                        audioLevel > 50 ? "#f59e0b" : "#22c55e",
                      borderRadius: 99,
                    }}
                  />
                </div>
                <span style={{ color: "#475569", fontSize: 11, width: 28, textAlign: "right" }}>
                  {audioLevel}
                </span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Checks Panel */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            backgroundColor: "#1e293b",
            borderRadius: 18,
            border: "1px solid #334155",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #334155",
            }}
          >
            <p style={{ color: "white", fontWeight: 700, fontSize: 13 }}>
              ✅ Verification Checklist
            </p>
          </div>

          <div
            style={{
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {[
              { key: "permissions", label: "Permissions", emoji: "🔐" },
              { key: "camera", label: "Camera", emoji: "📷" },
              { key: "microphone", label: "Microphone", emoji: "🎤" },
              { key: "face", label: "Face Detection", emoji: "👤" },
              { key: "singleFace", label: "Single Candidate", emoji: "🧑" },
              { key: "fullscreen", label: "Fullscreen Mode", emoji: "🖥️" },
            ].map((check) => (
              <CheckItem
                key={check.key}
                label={check.label}
                emoji={check.emoji}
                status={checks[check.key]}
                message={messages[check.key]}
              />
            ))}
          </div>

          {checks.fullscreen === STATUS.FAILED && (
            <div style={{ padding: "0 14px 14px" }}>
              <button
                onClick={enableFullscreen}
                className="btn-primary"
                style={{ width: "100%", fontSize: 13 }}
              >
                🖥️ Enable Fullscreen
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Model Download Notice */}
      <AnimatePresence>
        {modelError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              maxWidth: 860,
              width: "100%",
              marginTop: 16,
              backgroundColor: "#1e293b",
              borderRadius: 14,
              padding: 16,
              border: "1px solid #ef4444",
            }}
          >
            <p
              style={{
                color: "#ef4444",
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 8,
              }}
            >
              ❌ Face Detection Models Missing
            </p>
            <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 10 }}>
              Download these files and place in{" "}
              <code
                style={{
                  backgroundColor: "#0f172a",
                  padding: "1px 6px",
                  borderRadius: 4,
                  fontSize: 11,
                }}
              >
                frontend/public/models/
              </code>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                "tiny_face_detector_model-weights_manifest.json",
                "tiny_face_detector_model-shard1",
              ].map((file) => (
                <a
                  key={file}
                  href={`https://github.com/justadudewhohacks/face-api.js/raw/master/weights/${file}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    backgroundColor: "#0f172a",
                    borderRadius: 8,
                    color: "#6366f1",
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                    border: "1px solid #334155",
                  }}
                >
                  ⬇️ {file}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Summary */}
      <AnimatePresence>
        {!isRunning &&
          Object.values(checks).some((v) => v !== STATUS.PENDING) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                maxWidth: 860,
                width: "100%",
                marginTop: 16,
                backgroundColor: allPassed ? "#052e16" : "#1e293b",
                border: `1px solid ${allPassed ? "#166534" : "#334155"}`,
                borderRadius: 14,
                padding: "1rem 1.25rem",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: allPassed ? "#22c55e" : "#f59e0b",
                }}
              >
                {allPassed
                  ? "✅ ALL CHECKS PASSED — READY TO START"
                  : "⚠️ SOME CHECKS FAILED — PLEASE FIX AND RETRY"}
              </p>
              {!allPassed && (
                <p style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                  Fix the failed checks and run verification again
                </p>
              )}
            </motion.div>
          )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div
        style={{
          maxWidth: 860,
          width: "100%",
          marginTop: 16,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <motion.button
          whileHover={!isRunning && !isStarting ? { scale: 1.01 } : {}}
          whileTap={!isRunning && !isStarting ? { scale: 0.99 } : {}}
          onClick={runAllChecks}
          disabled={isRunning || isStarting}
          style={{
            flex: 1,
            padding: "13px",
            backgroundColor: isRunning ? "#334155" : "#1e40af",
            color: "white",
            border: "none",
            borderRadius: 14,
            cursor: isRunning || isStarting ? "not-allowed" : "pointer",
            fontSize: 14,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: isRunning || isStarting ? 0.7 : 1,
            minWidth: 200,
            fontFamily: "inherit",
          }}
        >
          {isRunning ? (
            <>
              <LoadingSpinner size="sm" color="white" />
              Running Checks...
            </>
          ) : (
            "🔍 Run Verification Checks"
          )}
        </motion.button>

        <motion.button
          whileHover={allPassed && !isStarting && !isRunning ? { scale: 1.01 } : {}}
          whileTap={allPassed && !isStarting && !isRunning ? { scale: 0.99 } : {}}
          onClick={handleStartExam}
          disabled={!allPassed || isStarting || isRunning}
          style={{
            flex: 1,
            padding: "13px",
            background:
              allPassed && !isStarting
                ? "linear-gradient(135deg, #16a34a, #15803d)"
                : "#334155",
            color: "white",
            border: "none",
            borderRadius: 14,
            cursor:
              allPassed && !isStarting && !isRunning
                ? "pointer"
                : "not-allowed",
            fontSize: 14,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: allPassed && !isStarting ? 1 : 0.4,
            minWidth: 200,
            transition: "all 0.3s",
            fontFamily: "inherit",
            boxShadow:
              allPassed && !isStarting
                ? "0 4px 14px rgba(22, 163, 74, 0.3)"
                : "none",
          }}
        >
          {isStarting ? (
            <>
              <LoadingSpinner size="sm" color="white" />
              Starting Exam...
            </>
          ) : (
            "🚀 Start Exam"
          )}
        </motion.button>
      </div>

      {/* Back */}
      <button
        onClick={() => {
          stopEverything();
          navigate(-1);
        }}
        style={{
          marginTop: 16,
          background: "none",
          border: "none",
          color: "#475569",
          cursor: "pointer",
          fontSize: 13,
          fontFamily: "inherit",
        }}
      >
        ← Go Back
      </button>

      {/* Instructions */}
      <div
        style={{
          maxWidth: 860,
          width: "100%",
          marginTop: 20,
          backgroundColor: "#1e293b",
          borderRadius: 14,
          padding: 16,
          border: "1px solid #334155",
        }}
      >
        <p
          style={{
            color: "#64748b",
            fontSize: 11,
            fontWeight: 700,
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Before you start
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {[
            "Sit in a well-lit room",
            "Look directly at the camera",
            "Only you should be visible",
            "Fullscreen mode is mandatory",
            "Do not switch tabs",
            "All activity is monitored",
          ].map((tip, i) => (
            <p key={i} style={{ color: "#64748b", fontSize: 12 }}>
              • {tip}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

// Check Item Component
const CheckItem = ({ label, emoji, status, message }) => {
  const getIcon = () => {
    if (status === STATUS.PENDING)
      return <span style={{ color: "#475569", fontSize: 16 }}>⭕</span>;
    if (status === STATUS.CHECKING)
      return (
        <div
          style={{
            width: 16,
            height: 16,
            border: "2px solid #6366f1",
            borderTop: "2px solid transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      );
    if (status === STATUS.PASSED)
      return <span style={{ fontSize: 16 }}>✅</span>;
    return <span style={{ fontSize: 16 }}>❌</span>;
  };

  const labelColor =
    status === STATUS.PASSED
      ? "#22c55e"
      : status === STATUS.FAILED
      ? "#ef4444"
      : status === STATUS.CHECKING
      ? "#6366f1"
      : "#475569";

  return (
    <div
      style={{
        backgroundColor: "#0f172a",
        borderRadius: 10,
        padding: "10px 12px",
        border: `1px solid ${
          status === STATUS.PASSED
            ? "#166534"
            : status === STATUS.FAILED
            ? "#991b1b"
            : "#1e293b"
        }`,
        transition: "border-color 0.3s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>{emoji}</span>
          <span
            style={{
              color: labelColor,
              fontSize: 13,
              fontWeight: 600,
              transition: "color 0.3s",
            }}
          >
            {label}
          </span>
        </div>
        {getIcon()}
      </div>
      {message && (
        <p
          style={{
            color: status === STATUS.FAILED ? "#fca5a5" : "#64748b",
            fontSize: 11,
            marginTop: 6,
            lineHeight: 1.5,
            whiteSpace: "pre-line",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default EnvironmentCheck;