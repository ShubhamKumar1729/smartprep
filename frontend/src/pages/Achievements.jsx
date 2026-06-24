import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import achievementService from "../services/achievementService.js";
import useToast from "../hooks/useToast.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import { formatDate } from "../utils/formatters.js";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const badgeEmojis = {
  "First Test Completed": "🎯",
  "10 Tests Completed": "🔟",
  "90% Score Achieved": "🌟",
  "Perfect Score": "💯",
  "7 Day Study Streak": "🔥",
};

const Achievements = () => {
  const { error: toastError } = useToast();

  const [achievements, setAchievements] = useState([]);
  const [xp, setXP] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("badges");

  useEffect(() => {
    Promise.all([
      achievementService.getAll(),
      achievementService.getXP(),
      achievementService.leaderboard(),
    ])
      .then(([a, x, l]) => {
        setAchievements(a.data.achievements || []);
        setXP(x.data.xp);
        setLeaderboard(l.data.leaderboard || []);
      })
      .catch(() => toastError("Failed to load achievements"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const nextLevelXP = (xp?.level || 1) * 500;
  const currentLevelXP = ((xp?.level || 1) - 1) * 500;
  const progressInLevel = (xp?.totalXP || 0) - currentLevelXP;
  const xpForLevel = nextLevelXP - currentLevelXP;
  const levelProgress = Math.min(100, Math.round((progressInLevel / xpForLevel) * 100));

  const tabs = [
    { id: "badges", label: "Badges", emoji: "🏅" },
    { id: "leaderboard", label: "Leaderboard", emoji: "🏆" },
  ];

  const allBadges = [
    { badge: "First Test Completed", description: "Complete your first test", xp: 100 },
    { badge: "10 Tests Completed", description: "Complete 10 tests", xp: 250 },
    { badge: "90% Score Achieved", description: "Score 90% or above", xp: 200 },
    { badge: "Perfect Score", description: "Score 100% in a test", xp: 300 },
    { badge: "7 Day Study Streak", description: "Study 7 days in a row", xp: 150 },
  ];

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
          Achievements
        </h1>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
          Your XP, badges, streaks and leaderboard ranking
        </p>
      </motion.div>

      {/* XP Card */}
      <motion.div
        variants={item}
        style={{
          background: "linear-gradient(135deg, #4338ca 0%, #7c3aed 50%, #6366f1 100%)",
          borderRadius: 20,
          padding: "1.75rem",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.06)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div>
            <p style={{ opacity: 0.7, fontSize: 13, marginBottom: 6 }}>
              Total Experience Points
            </p>
            <p
              style={{
                fontSize: 44,
                fontWeight: 900,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              {xp?.totalXP || 0}
              <span style={{ fontSize: 16, opacity: 0.6, marginLeft: 4 }}>
                XP
              </span>
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: 12,
                padding: "8px 16px",
                marginBottom: 8,
              }}
            >
              <p style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>
                Current Level
              </p>
              <p style={{ fontSize: 28, fontWeight: 900 }}>
                Level {xp?.level || 1}
              </p>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div style={{ marginTop: 16, position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              opacity: 0.7,
              marginBottom: 8,
            }}
          >
            <span>Level {xp?.level || 1}</span>
            <span>
              {progressInLevel}/{xpForLevel} XP to Level{" "}
              {(xp?.level || 1) + 1}
            </span>
          </div>
          <div
            style={{
              height: 8,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{
                height: "100%",
                backgroundColor: "white",
                borderRadius: 999,
              }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.15)",
            flexWrap: "wrap",
            position: "relative",
            zIndex: 1,
          }}
        >
          {[
            {
              label: "Current Streak",
              value: `${xp?.currentStreak || 0} days`,
              emoji: "🔥",
            },
            {
              label: "Best Streak",
              value: `${xp?.longestStreak || 0} days`,
              emoji: "🏅",
            },
            {
              label: "Badges Earned",
              value: achievements.length,
              emoji: "⭐",
            },
          ].map((stat) => (
            <div key={stat.label}>
              <p style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>
                {stat.emoji} {stat.label}
              </p>
              <p style={{ fontSize: 16, fontWeight: 800 }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        variants={item}
        style={{ display: "flex", gap: 8 }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 18px",
              borderRadius: 10,
              border: `1.5px solid ${
                activeTab === tab.id ? "#6366f1" : "#e2e8f0"
              }`,
              backgroundColor:
                activeTab === tab.id ? "#eef2ff" : "white",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: activeTab === tab.id ? "#4338ca" : "#64748b",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s",
            }}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Badges Tab */}
        {activeTab === "badges" && (
          <motion.div
            key="badges"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 14,
              }}
            >
              {allBadges.map((badge, index) => {
                const earned = achievements.find(
                  (a) => a.badge === badge.badge
                );
                const emoji =
                  badgeEmojis[badge.badge] || "🏅";

                return (
                  <motion.div
                    key={badge.badge}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.07 }}
                    style={{
                      backgroundColor: earned ? "#fffbeb" : "#f8fafc",
                      border: `1.5px solid ${
                        earned ? "#fde68a" : "#e2e8f0"
                      }`,
                      borderRadius: 16,
                      padding: "1.25rem",
                      position: "relative",
                      transition: "all 0.2s",
                      opacity: earned ? 1 : 0.6,
                    }}
                    whileHover={
                      earned
                        ? { boxShadow: "0 8px 24px rgba(245,158,11,0.15)", y: -2 }
                        : {}
                    }
                  >
                    {/* Lock / Unlock */}
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        fontSize: 16,
                      }}
                    >
                      {earned ? "🔓" : "🔒"}
                    </div>

                    {/* Badge Icon */}
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        backgroundColor: earned ? "#fef3c7" : "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 28,
                        marginBottom: 12,
                      }}
                    >
                      {emoji}
                    </div>

                    <h4
                      style={{
                        fontWeight: 800,
                        color: earned ? "#92400e" : "#374151",
                        fontSize: 14,
                        marginBottom: 4,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {badge.badge}
                    </h4>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        lineHeight: 1.5,
                        marginBottom: 10,
                      }}
                    >
                      {badge.description}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: earned ? "#d97706" : "#94a3b8",
                        }}
                      >
                        ⚡ +{badge.xp} XP
                      </span>
                      {earned && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "#94a3b8",
                          }}
                        >
                          {formatDate(earned.earnedAt)}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* How to earn more */}
            <div
              className="card"
              style={{
                backgroundColor: "#eef2ff",
                border: "1px solid #c7d2fe",
              }}
            >
              <h3
                style={{
                  fontWeight: 700,
                  color: "#4338ca",
                  fontSize: 14,
                  marginBottom: 10,
                }}
              >
                💡 How to earn more XP
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 8,
                }}
              >
                {[
                  { action: "Complete a test", xp: "+20 XP" },
                  { action: "Score 90%+", xp: "+200 XP" },
                  { action: "Perfect Score", xp: "+300 XP" },
                  { action: "7-day streak", xp: "+150 XP" },
                ].map((item) => (
                  <div
                    key={item.action}
                    style={{
                      backgroundColor: "white",
                      borderRadius: 10,
                      padding: "8px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 12, color: "#374151" }}>
                      {item.action}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: "#4338ca",
                      }}
                    >
                      {item.xp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === "leaderboard" && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
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
              🏆 Top Learners
            </h3>

            {leaderboard.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "2rem" }}>
                No leaderboard data yet
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {leaderboard.map((entry, index) => {
                  const medal =
                    index === 0
                      ? "🥇"
                      : index === 1
                      ? "🥈"
                      : index === 2
                      ? "🥉"
                      : null;

                  return (
                    <motion.div
                      key={entry._id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "12px 14px",
                        backgroundColor:
                          index === 0
                            ? "#fffbeb"
                            : index < 3
                            ? "#f8fafc"
                            : "white",
                        borderRadius: 12,
                        border: `1px solid ${
                          index === 0
                            ? "#fde68a"
                            : "#f1f5f9"
                        }`,
                      }}
                    >
                      {/* Rank */}
                      <div
                        style={{
                          width: 36,
                          textAlign: "center",
                          flexShrink: 0,
                        }}
                      >
                        {medal ? (
                          <span style={{ fontSize: 22 }}>{medal}</span>
                        ) : (
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 800,
                              color: "#94a3b8",
                            }}
                          >
                            #{index + 1}
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #6366f1, #8b5cf6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            color: "white",
                            fontWeight: 800,
                            fontSize: 15,
                          }}
                        >
                          {entry.userId?.name?.charAt(0)?.toUpperCase() ||
                            "?"}
                        </span>
                      </div>

                      {/* Name */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          className="line-clamp-1"
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#0f172a",
                          }}
                        >
                          {entry.userId?.name || "Anonymous"}
                        </p>
                        <p style={{ fontSize: 11, color: "#94a3b8" }}>
                          Level {entry.level}
                        </p>
                      </div>

                      {/* XP */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p
                          style={{
                            fontSize: 16,
                            fontWeight: 900,
                            color:
                              index === 0
                                ? "#d97706"
                                : "#6366f1",
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {entry.totalXP}
                        </p>
                        <p style={{ fontSize: 10, color: "#94a3b8" }}>
                          XP
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Achievements;