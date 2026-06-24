require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`🚀 SmartPrep Server Running`);
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌍 Mode: ${process.env.NODE_ENV}`);
      console.log(`🔗 http://localhost:${PORT}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    });

    process.on("unhandledRejection", (err) => {
      console.error("Unhandled Rejection:", err.message);
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start:", error.message);
    process.exit(1);
  }
};

startServer();