const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const os = require("os");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

// Check if path is a URL (Cloudinary link)
const isUrl = (str) => {
  return str && (str.startsWith("http://") || str.startsWith("https://"));
};

// Download file from URL to temp folder
const downloadFromUrl = (url) => {
  return new Promise((resolve, reject) => {
    const ext = path.extname(url.split("?")[0]) || ".tmp";
    const tmpPath = path.join(os.tmpdir(), `smartprep_${Date.now()}${ext}`);
    const file = fs.createWriteStream(tmpPath);
    const protocol = url.startsWith("https") ? https : http;

    protocol
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve(tmpPath);
        });
      })
      .on("error", (err) => {
        fs.unlink(tmpPath, () => {});
        reject(err);
      });
  });
};

const extractFromPDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text || "";
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
};

const extractFromDOCX = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || "";
  } catch (error) {
    throw new Error(`DOCX extraction failed: ${error.message}`);
  }
};

const extractFromPPTX = async (filePath) => {
  try {
    const AdmZip = require("adm-zip");
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();
    let allText = [];

    zipEntries.forEach((entry) => {
      if (
        entry.entryName.startsWith("ppt/slides/slide") &&
        entry.entryName.endsWith(".xml") &&
        !entry.entryName.includes("slideLayout") &&
        !entry.entryName.includes("slideMaster")
      ) {
        const content = entry.getData().toString("utf8");
        const cleaned = content
          .replace(/<a:t[^>]*>/g, " ")
          .replace(/<\/a:t>/g, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&#x[0-9A-Fa-f]+;/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        if (cleaned.length > 10) allText.push(cleaned);
      }

      if (
        entry.entryName.startsWith("ppt/notesSlides/") &&
        entry.entryName.endsWith(".xml")
      ) {
        const content = entry.getData().toString("utf8");
        const cleaned = content
          .replace(/<a:t[^>]*>/g, " ")
          .replace(/<\/a:t>/g, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        if (cleaned.length > 10) allText.push("Notes: " + cleaned);
      }
    });

    return allText.join("\n\n");
  } catch {
    return "";
  }
};

const extractText = async (filePath, fileType) => {
  let tmpPath = null;
  let actualPath = filePath;

  try {
    // If it's a Cloudinary URL, download it first
    if (isUrl(filePath)) {
      tmpPath = await downloadFromUrl(filePath);
      actualPath = tmpPath;
    } else {
      if (!fs.existsSync(actualPath)) {
        throw new Error(`File not found: ${actualPath}`);
      }
    }

    let text = "";

    if (fileType === "application/pdf") {
      text = await extractFromPDF(actualPath);
    } else if (
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileType === "application/msword"
    ) {
      text = await extractFromDOCX(actualPath);
    } else if (
      fileType ===
        "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
      fileType === "application/vnd.ms-powerpoint"
    ) {
      text = await extractFromPPTX(actualPath);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    return text;
  } finally {
    // Clean up temp file
    if (tmpPath && fs.existsSync(tmpPath)) {
      fs.unlink(tmpPath, () => {});
    }
  }
};

const cleanText = (rawText) => {
  if (!rawText) return "";
  return rawText
    .replace(/\s+/g, " ")
    .replace(/[^\w\s.,!?;:()\-'"]/g, " ")
    .replace(/  +/g, " ")
    .split("\n")
    .filter((line) => line.trim().length > 3)
    .join("\n")
    .trim();
};

const getSentences = (text) => {
  if (!text) return [];
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
};

module.exports = {
  extractText,
  cleanText,
  getSentences,
  extractFromPDF,
  extractFromDOCX,
};