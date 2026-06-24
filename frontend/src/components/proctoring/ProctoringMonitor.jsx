import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import proctoringService from "../../services/proctoringService.js";

let faceapi = null;

const ProctoringMonitor = ({ attemptId, testId, enabled = true }) => {
  const location = useLocation();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const faceIntervalRef = useRef(null);
  const audioIntervalRef = useRef(null);
  const browserCleanupRef = useRef(null);
  const isCleanedUpRef = useRef(false);

  const [camStatus, setCamStatus] = useState("starting");
  const [riskScore, setRiskScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState("low");
  const [faceStatus, setFaceStatus] = useState("loading");
  const [isActive, setIsActive] = useState(true);

  const lastFaceMissingRef = useRef(0);
  const lastMultipleFacesRef = useRef(0);
  const lastAudioRef = useRef(0);
  const lastBrowserRef = useRef(0);
  const faceMissingStartRef = useRef(null);

  // ── Cleanup function ──
  const stopEverything = () => {
    if (isCleanedUpRef.current) return;
    isCleanedUpRef.current = true;

    console.log("🛑 Stopping proctoring - turning off camera");

    // Stop face detection
    if (faceIntervalRef.current) {
      clearInterval(faceIntervalRef.current);
      faceIntervalRef.current = null;
    }

    // Stop audio monitoring
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }

    // Stop browser monitoring
    if (browserCleanupRef.current) {
      browserCleanupRef.current();
      browserCleanupRef.current = null;
    }

    // Stop audio context
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }

    // Stop all camera/mic tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log(`Track stopped: ${track.kind}`);
      });
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCamStatus("stopped");
    setIsActive(false);

    // End proctoring session on server
    if (attemptId && testId) {
      proctoringService
        .end({ attemptId, testId })
        .catch(() => {});
    }
  };

  const emitEvent = async (eventType, severity = "info", metadata = {}) => {
    if (!isActive || isCleanedUpRef.current) return;
    try {
      const res = await proctoringService.event({
        attemptId,
        testId,
        eventType,
        severity,
        metadata,
      });
      if (res.data?.risk) {
        setRiskScore(res.data.risk.riskScore || 0);
        setRiskLevel(res.data.risk.riskLevel || "low");
      }
    } catch {}
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: true,
      });

      // Check if already cleaned up while waiting for permission
      if (isCleanedUpRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setCamStatus("active");
      emitEvent("camera_started", "info");
      startAudioMonitoring(stream);
    } catch {
      setCamStatus("denied");
      emitEvent("camera_permission_denied", "high");
    }
  };

  const startAudioMonitoring = (stream) => {
    if (isCleanedUpRef.current) return;
    try {
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioContextRef.current = audioCtx;

      const data = new Uint8Array(analyser.frequencyBinCount);

      audioIntervalRef.current = setInterval(() => {
        if (isCleanedUpRef.current) return;
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((s, v) => s + v, 0) / data.length;
        const now = Date.now();

        if (avg > 80 && now - lastAudioRef.current > 10000) {
          lastAudioRef.current = now;
          emitEvent("excessive_audio", "medium", {
            level: Math.round(avg),
          });
        }
      }, 2000);
    } catch {}
  };

  const loadFaceAPI = async () => {
    if (isCleanedUpRef.current) return false;
    try {
      const module = await import("face-api.js");
      faceapi = module;
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      setFaceStatus("ready");
      return true;
    } catch {
      setFaceStatus("unavailable");
      emitEvent("face_detection_unavailable", "low", {
        reason: "Models missing",
      });
      return false;
    }
  };

  const startFaceDetection = () => {
    if (!faceapi || !videoRef.current || isCleanedUpRef.current) return;

    faceIntervalRef.current = setInterval(async () => {
      if (isCleanedUpRef.current) return;
      try {
        if (!videoRef.current || videoRef.current.readyState < 2) return;

        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.3,
          })
        );

        if (isCleanedUpRef.current) return;

        const now = Date.now();

        if (detections.length === 0) {
          setFaceStatus("missing");
          if (!faceMissingStartRef.current)
            faceMissingStartRef.current = now;
          const duration = now - faceMissingStartRef.current;

          if (
            duration >= 5000 &&
            now - lastFaceMissingRef.current > 10000
          ) {
            lastFaceMissingRef.current = now;
            emitEvent("face_missing", "high", {
              durationMs: duration,
            });
          }
        } else if (detections.length > 1) {
          setFaceStatus("multiple");
          if (now - lastMultipleFacesRef.current > 10000) {
            lastMultipleFacesRef.current = now;
            emitEvent("multiple_faces", "high", {
              count: detections.length,
            });
          }
        } else {
          faceMissingStartRef.current = null;
          setFaceStatus("present");
        }
      } catch {}
    }, 2500);
  };

  const setupBrowserMonitoring = () => {
    if (isCleanedUpRef.current) return () => {};

    const emit = (type, severity = "medium") => {
      if (isCleanedUpRef.current) return;
      const now = Date.now();
      if (now - lastBrowserRef.current < 3000) return;
      lastBrowserRef.current = now;
      emitEvent(type, severity);
    };

    const onVisibility = () => {
      if (document.hidden) emit("tab_switch");
    };
    const onBlur = () => emit("window_blur");
    const onFullscreen = () => {
      if (!document.fullscreenElement) emit("fullscreen_exit");
    };
    const onUnload = () => emitEvent("page_reload", "high");

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreen);
    window.addEventListener("beforeunload", onUnload);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreen);
      window.removeEventListener("beforeunload", onUnload);
    };
  };

  // ── Main Effect - Start Everything ──
  useEffect(() => {
    if (!enabled || !attemptId || !testId) return;

    isCleanedUpRef.current = false;
    setIsActive(true);

    const init = async () => {
      await proctoringService
        .start({ attemptId, testId })
        .catch(() => {});

      if (isCleanedUpRef.current) return;

      await startCamera();

      if (isCleanedUpRef.current) return;

      const faceReady = await loadFaceAPI();

      if (isCleanedUpRef.current) return;

      if (faceReady) startFaceDetection();
      browserCleanupRef.current = setupBrowserMonitoring();
    };

    init();

    // Cleanup on unmount
    return () => {
      stopEverything();
    };
  }, [enabled, attemptId, testId]);

  // ── Watch for route changes (handles navigation to result page) ──
  useEffect(() => {
    // If we navigate away from exam page, stop everything
    if (!location.pathname.includes("/exam/")) {
      stopEverything();
    }
  }, [location.pathname]);

  // ── Listen for custom stop event ──
  useEffect(() => {
    const handleStop = () => {
      stopEverything();
    };

    window.addEventListener("smartprep-stop-proctoring", handleStop);

    return () => {
      window.removeEventListener(
        "smartprep-stop-proctoring",
        handleStop
      );
    };
  }, []);

  // Don't render if not active
  if (!isActive || isCleanedUpRef.current) return null;

  const riskColors = {
    low: "#16a34a",
    medium: "#d97706",
    high: "#dc2626",
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 9999,
        width: 200,
        backgroundColor: "#0f172a",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
        border: "1px solid #1e293b",
      }}
    >
      {/* Camera */}
      <div style={{ position: "relative" }}>
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            width: "100%",
            height: 110,
            objectFit: "cover",
            backgroundColor: "#020617",
            display: camStatus === "active" ? "block" : "none",
          }}
        />

        {camStatus !== "active" && (
          <div
            style={{
              width: "100%",
              height: 110,
              backgroundColor: "#020617",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            {camStatus === "denied" ? "🚫" : "📷"}
          </div>
        )}

        {/* Live dot */}
        {camStatus === "active" && (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              display: "flex",
              alignItems: "center",
              gap: 5,
              backgroundColor: "rgba(0,0,0,0.6)",
              borderRadius: 99,
              padding: "3px 8px",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#ef4444",
                animation: "pulse 1s infinite",
              }}
            />
            <span
              style={{
                color: "white",
                fontSize: 9,
                fontWeight: 700,
              }}
            >
              LIVE
            </span>
          </div>
        )}
      </div>

      {/* Status */}
      <div style={{ padding: 10 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              color: "#94a3b8",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            PROCTORING
          </span>
          <span
            style={{
              color: riskColors[riskLevel] || "#16a34a",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {riskScore} pts
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
          }}
        >
          {[
            {
              label: "Camera",
              value: camStatus,
              good: camStatus === "active",
            },
            {
              label: "Face",
              value: faceStatus,
              good:
                faceStatus === "present" || faceStatus === "ready",
            },
            {
              label: "Risk",
              value: riskLevel,
              good: riskLevel === "low",
            },
            {
              label: "Monitor",
              value: "ON",
              good: true,
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                backgroundColor: "#1e293b",
                borderRadius: 8,
                padding: "5px 7px",
              }}
            >
              <p
                style={{
                  fontSize: 9,
                  color: "#64748b",
                  marginBottom: 2,
                }}
              >
                {s.label}
              </p>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: s.good ? "#22c55e" : "#ef4444",
                  textTransform: "capitalize",
                }}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProctoringMonitor;