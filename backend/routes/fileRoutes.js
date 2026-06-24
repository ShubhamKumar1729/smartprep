const express = require("express");
const router = express.Router();
const { uploadFiles, getFiles, getFile, downloadFile, deleteFile } = require("../controllers/fileController");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

router.use(protect);
router.post("/upload", upload.array("files", 10), uploadFiles);
router.get("/", getFiles);
router.get("/download/:id", downloadFile);
router.get("/:id", getFile);
router.delete("/:id", deleteFile);

module.exports = router;