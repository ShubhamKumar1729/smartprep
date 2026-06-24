import api from "./api.js";

const achievementService = {
  getAll: () => api.get("/achievements").then((r) => r.data),
  getXP: () => api.get("/achievements/xp").then((r) => r.data),
  leaderboard: () => api.get("/achievements/leaderboard").then((r) => r.data),
};

export default achievementService;