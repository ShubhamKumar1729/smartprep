const File = require("../models/File");
const Collection = require("../models/Collection");
const ExtractedContent = require("../models/ExtractedContent");
const Question = require("../models/Question");
const Test = require("../models/Test");
const TestQuestion = require("../models/TestQuestion");
const extractionService = require("../services/extractionService");
const nlpService = require("../services/nlpService");
const summaryService = require("../services/summaryService");
const notesService = require("../services/notesService");
const flashcardService = require("../services/flashcardService");
const questionService = require("../services/questionService");
const { sendSuccess, sendError } = require("../utils/responseHelper");
const fs = require("fs");

// ─── Helper: Process single file ───
const processFile = async (file, userId) => {
  try {
    let extracted = await ExtractedContent.findOne({
      fileId: file._id,
      processingStatus: "completed",
    });

    if (extracted) return extracted;

    if (!fs.existsSync(file.filePath)) {
      console.error(`File missing on disk: ${file.filePath}`);
      return null;
    }

    const rawText = await extractionService.extractText(file.filePath, file.fileType);
    if (!rawText || rawText.trim().length < 10) return null;

    const cleanedText = extractionService.cleanText(rawText);
    const keywords = nlpService.extractKeywords(cleanedText, 20);
    const topics = nlpService.extractTopics(cleanedText);
    const headings = nlpService.extractHeadings(cleanedText);
    const definitions = nlpService.extractDefinitions(cleanedText);
    const stats = nlpService.getTextStats(cleanedText);

    extracted = await ExtractedContent.findOneAndUpdate(
      { fileId: file._id },
      {
        fileId: file._id,
        collectionId: file.collectionId,
        userId,
        extractedText: rawText,
        cleanedText,
        keywords,
        topics,
        headings,
        definitions,
        wordCount: stats.wordCount,
        sentences: stats.sentences,
        processingStatus: "completed",
      },
      { upsert: true, new: true }
    );

    return extracted;
  } catch (error) {
    console.error(`processFile error for ${file.originalName}:`, error.message);
    return null;
  }
};

// ─── Helper: Process multiple files and merge ───
const processAndMerge = async (fileIds, userId) => {
  const files = await File.find({ _id: { $in: fileIds }, userId });
  if (files.length === 0) throw new Error("No files found");

  const extractions = [];
  for (const file of files) {
    const extracted = await processFile(file, userId);
    if (extracted) extractions.push(extracted);
  }

  if (extractions.length === 0) {
    throw new Error(
      "Could not extract text from any file. Make sure files contain readable text and exist on disk."
    );
  }

  const mergedText = extractions.map((e) => e.cleanedText).join("\n\n");
  const allTopics = extractions.flatMap((e) => e.topics || []);
  const allKeywords = [...new Set(extractions.flatMap((e) => e.keywords || []))];
  const allDefinitions = extractions.flatMap((e) => e.definitions || []);

  return { files, extractions, mergedText, allTopics, allKeywords, allDefinitions };
};

// ─── Helper: Generate questions ───
const buildQuestions = (mergedText, allTopics, allKeywords, allDefinitions, questionType, count) => {
  const parsedCount = parseInt(count) || 10;

  switch (questionType) {
    case "mcq":
      return questionService.generateMCQs(mergedText, allTopics, allDefinitions, allKeywords, parsedCount);
    case "truefalse":
      return questionService.generateTrueFalse(mergedText, allDefinitions, parsedCount);
    case "fillinblanks":
      return questionService.generateFillBlanks(mergedText, allKeywords, parsedCount);
    case "shortanswer":
      return questionService.generateShortAnswers(allTopics, allDefinitions, parsedCount);
    case "viva":
      return questionService.generateVivaQuestions(allTopics, allDefinitions, allKeywords, mergedText);
    case "mixed": {
      const mcqs = questionService.generateMCQs(mergedText, allTopics, allDefinitions, allKeywords, Math.ceil(parsedCount * 0.5));
      const tf = questionService.generateTrueFalse(mergedText, allDefinitions, Math.ceil(parsedCount * 0.25));
      const sa = questionService.generateShortAnswers(allTopics, allDefinitions, Math.ceil(parsedCount * 0.25));
      return [...mcqs, ...tf, ...sa].slice(0, parsedCount);
    }
    default:
      return questionService.generateMCQs(mergedText, allTopics, allDefinitions, allKeywords, parsedCount);
  }
};

// ─── Get or create default collection ───
const getOrCreateCollection = async (req, res, next) => {
  try {
    let collection = await Collection.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    if (!collection) {
      collection = await Collection.create({
        title: "My Study Materials",
        description: "Default collection",
        userId: req.user._id,
      });
    }
    return sendSuccess(res, 200, "Collection fetched", { collection });
  } catch (error) {
    next(error);
  }
};

// ─── Get all files with processing status ───
const getFiles = async (req, res, next) => {
  try {
    const files = await File.find({ userId: req.user._id })
      .populate("collectionId", "title")
      .sort({ uploadedAt: -1 })
      .lean();

    const fileIds = files.map((f) => f._id);
    const extracted = await ExtractedContent.find({
      fileId: { $in: fileIds },
      processingStatus: "completed",
    }).select("fileId wordCount");

    const extractedMap = {};
    extracted.forEach((e) => { extractedMap[e.fileId.toString()] = e; });

    const filesWithStatus = files.map((file) => ({
      ...file,
      isProcessed: !!extractedMap[file._id.toString()],
      wordCount: extractedMap[file._id.toString()]?.wordCount || 0,
    }));

    return sendSuccess(res, 200, "Files fetched", { files: filesWithStatus });
  } catch (error) {
    next(error);
  }
};

// ─── Auto process files ───
const autoProcess = async (req, res, next) => {
  try {
    const { fileIds } = req.body;
    if (!fileIds || fileIds.length === 0) return sendError(res, 400, "Select at least one file");

    const files = await File.find({ _id: { $in: fileIds }, userId: req.user._id });
    if (files.length === 0) return sendError(res, 404, "Files not found");

    const results = [];
    for (const file of files) {
      const extracted = await processFile(file, req.user._id);
      results.push({
        fileId: file._id,
        fileName: file.originalName,
        status: extracted ? "success" : "failed",
        wordCount: extracted?.wordCount || 0,
      });
    }

    const successful = results.filter((r) => r.status === "success");
    return sendSuccess(res, 200, `${successful.length}/${files.length} processed`, { results });
  } catch (error) {
    next(error);
  }
};

// ─── Generate Summary ───
const generateSummary = async (req, res, next) => {
  try {
    const { fileIds, summaryType = "short" } = req.body;
    if (!fileIds || fileIds.length === 0) return sendError(res, 400, "Select at least one file");

    const { mergedText, allTopics, allKeywords } = await processAndMerge(fileIds, req.user._id);

    let content = "";
    let chapters = [];
    let topics = [];

    switch (summaryType) {
      case "short":
        content = summaryService.generateShortSummary(mergedText, allTopics, allKeywords);
        break;
      case "detailed":
        content = summaryService.generateDetailedSummary(mergedText, allTopics, allKeywords);
        break;
      case "chapterwise":
        chapters = summaryService.generateChapterSummary(mergedText, allTopics);
        content = chapters.map((c) => `${c.title}:\n${c.summary}`).join("\n\n");
        break;
      case "topicwise":
        topics = summaryService.generateTopicSummary(mergedText, allTopics, allKeywords);
        content = topics.map((t) => `${t.title}:\n${t.summary}`).join("\n\n");
        break;
      default:
        content = summaryService.generateShortSummary(mergedText, allTopics, allKeywords);
    }

    if (!content || content.length < 10) {
      return sendError(res, 400, "Could not generate summary. Try with more content.");
    }

    return sendSuccess(res, 200, "Summary generated", {
      summary: { content, summaryType, chapters, topics, wordCount: content.split(" ").length },
    });
  } catch (error) {
    return sendError(res, 400, error.message || "Failed to generate summary");
  }
};

// ─── Generate Notes ───
const generateNotes = async (req, res, next) => {
  try {
    const { fileIds, noteType = "quick" } = req.body;
    if (!fileIds || fileIds.length === 0) return sendError(res, 400, "Select at least one file");

    const { mergedText, allTopics, allKeywords, allDefinitions } = await processAndMerge(fileIds, req.user._id);

    let result = { content: "", bulletPoints: [], formulas: [] };

    switch (noteType) {
      case "quick":
        result = notesService.generateQuickNotes(mergedText, allKeywords, allDefinitions);
        break;
      case "detailed":
        result = notesService.generateDetailedNotes(mergedText, allTopics, allDefinitions, allKeywords);
        break;
      case "revision":
        result = notesService.generateRevisionNotes(mergedText, allKeywords, allTopics);
        break;
      case "formula":
        result = notesService.generateFormulaSheet(mergedText);
        break;
      default:
        result = notesService.generateQuickNotes(mergedText, allKeywords, allDefinitions);
    }

    if (!result.content || result.content.length < 5) {
      return sendError(res, 400, "Could not generate notes. Try with more content.");
    }

    return sendSuccess(res, 200, "Notes generated", {
      notes: { content: result.content, bulletPoints: result.bulletPoints || [], formulas: result.formulas || [], noteType },
    });
  } catch (error) {
    return sendError(res, 400, error.message || "Failed to generate notes");
  }
};

// ─── Generate Flashcards ───
const generateFlashcards = async (req, res, next) => {
  try {
    const { fileIds } = req.body;
    if (!fileIds || fileIds.length === 0) return sendError(res, 400, "Select at least one file");

    const { mergedText, allTopics, allDefinitions } = await processAndMerge(fileIds, req.user._id);
    const flashcards = flashcardService.generateAllFlashcards(mergedText, allTopics, allDefinitions);

    if (flashcards.length === 0) {
      return sendError(res, 400, "Could not generate flashcards. Try with more content.");
    }

    return sendSuccess(res, 200, "Flashcards generated", { flashcards, total: flashcards.length });
  } catch (error) {
    return sendError(res, 400, error.message || "Failed to generate flashcards");
  }
};

// ─── Create Proctored Test ───
const createInstantTest = async (req, res, next) => {
  try {
    const { fileIds, questionType = "mcq", count = 10, difficulty = "mixed", title = "Quick Test" } = req.body;
    if (!fileIds || fileIds.length === 0) return sendError(res, 400, "Select at least one file");

    const { files, mergedText, allTopics, allKeywords, allDefinitions } =
      await processAndMerge(fileIds, req.user._id);

    const questions = buildQuestions(mergedText, allTopics, allKeywords, allDefinitions, questionType, count);

    if (questions.length === 0) {
      return sendError(res, 400, "Could not generate questions. Add more content to files.");
    }

    const savedQuestions = await Question.insertMany(
      questions.map((q) => ({ ...q, fileId: files[0]._id, userId: req.user._id }))
    );

    const duration = Math.max(15, Math.ceil(savedQuestions.length * 1.5));

    const test = await Test.create({
      title,
      userId: req.user._id,
      collectionId: files[0].collectionId,
      fileId: files[0]._id,
      testType: questionType,
      difficulty,
      duration,
      questionCount: savedQuestions.length,
      questionTypes: [questionType],
    });

    await TestQuestion.insertMany(
      savedQuestions.map((q, index) => ({ testId: test._id, questionId: q._id, order: index + 1 }))
    );

    return sendSuccess(res, 201, "Test created", {
      testId: test._id,
      questionCount: savedQuestions.length,
      duration,
      title: test.title,
    });
  } catch (error) {
    return sendError(res, 400, error.message || "Failed to create test");
  }
};

module.exports = {
  getOrCreateCollection,
  getFiles,
  autoProcess,
  generateSummary,
  generateNotes,
  generateFlashcards,
  createInstantTest,
};