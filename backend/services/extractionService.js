const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

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
      // Get all slide XML files
      if (
        entry.entryName.startsWith("ppt/slides/slide") &&
        entry.entryName.endsWith(".xml") &&
        !entry.entryName.includes("slideLayout") &&
        !entry.entryName.includes("slideMaster")
      ) {
        const content = entry.getData().toString("utf8");

        // Remove XML tags and get clean text
        const cleaned = content
          // Get text between <a:t> tags
          .replace(/<a:t[^>]*>/g, " ")
          .replace(/<\/a:t>/g, " ")
          // Remove all other XML tags
          .replace(/<[^>]+>/g, " ")
          // Decode XML entities
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&#x[0-9A-Fa-f]+;/g, " ")
          // Clean whitespace
          .replace(/\s+/g, " ")
          .trim();

        if (cleaned.length > 10) {
          allText.push(cleaned);
        }
      }

      // Also get slide notes
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

        if (cleaned.length > 10) {
          allText.push("Notes: " + cleaned);
        }
      }
    });

    const finalText = allText.join("\n\n");

    if (!finalText || finalText.length < 10) {
      throw new Error(
        "No text could be extracted from PPTX. The file may contain only images."
      );
    }

    return finalText;
  } catch (error) {
    if (error.message.includes("No text")) throw error;
    throw new Error(`PPTX extraction failed: ${error.message}`);
  }
};

const extractText = async (filePath, fileType) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  if (fileType === "application/pdf") {
    return await extractFromPDF(filePath);
  } else if (
    fileType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileType === "application/msword"
  ) {
    return await extractFromDOCX(filePath);
  } else if (
    fileType ===
    "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    fileType === "application/vnd.ms-powerpoint"
  ) {
    return await extractFromPPTX(filePath);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
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