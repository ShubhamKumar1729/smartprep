const File = require("../models/File");
const Collection = require("../models/Collection");
const fs = require("fs");
const { sendSuccess, sendError, sendPaginated } = require("../utils/responseHelper");

const uploadFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return sendError(res, 400, "Please upload at least one file");
    }

    const { collectionId } = req.body;

    if (!collectionId) {
      req.files.forEach((file) => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); });
      return sendError(res, 400, "Collection ID is required");
    }

    const collection = await Collection.findOne({ _id: collectionId, userId: req.user._id });
    if (!collection) {
      req.files.forEach((file) => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); });
      return sendError(res, 404, "Collection not found");
    }

    const fileDocuments = req.files.map((file) => ({
      fileName: file.filename,
      originalName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      filePath: file.path,
      collectionId,
      userId: req.user._id,
    }));

    const savedFiles = await File.insertMany(fileDocuments);
    await Collection.findByIdAndUpdate(collectionId, { $inc: { fileCount: savedFiles.length } });

    return sendSuccess(res, 201, `${savedFiles.length} file(s) uploaded`, { files: savedFiles });
  } catch (error) {
    if (req.files) {
      req.files.forEach((file) => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); });
    }
    next(error);
  }
};

const getFiles = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "", sort = "-uploadedAt" } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const query = { userId: req.user._id };
    if (search) query.originalName = { $regex: search, $options: "i" };

    const [files, total] = await Promise.all([
      File.find(query).populate("collectionId", "title").sort(sort).skip(skip).limit(limitNum).lean(),
      File.countDocuments(query),
    ]);

    const pagination = {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      hasNextPage: pageNum < Math.ceil(total / limitNum),
      hasPrevPage: pageNum > 1,
    };

    return sendPaginated(res, files, pagination, "Files fetched");
  } catch (error) {
    next(error);
  }
};

const getFile = async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.user._id })
      .populate("collectionId", "title");
    if (!file) return sendError(res, 404, "File not found");
    return sendSuccess(res, 200, "File fetched", { file });
  } catch (error) {
    next(error);
  }
};

const downloadFile = async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
    if (!file) return sendError(res, 404, "File not found");
    if (!fs.existsSync(file.filePath)) return sendError(res, 404, "File not found on server");

    res.setHeader("Content-Disposition", `attachment; filename="${file.originalName}"`);
    res.setHeader("Content-Type", file.fileType);
    const fileStream = fs.createReadStream(file.filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
    if (!file) return sendError(res, 404, "File not found");

    if (fs.existsSync(file.filePath)) fs.unlinkSync(file.filePath);
    await Collection.findByIdAndUpdate(file.collectionId, { $inc: { fileCount: -1 } });
    await file.deleteOne();

    return sendSuccess(res, 200, "File deleted");
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadFiles, getFiles, getFile, downloadFile, deleteFile };