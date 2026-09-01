"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.getUrl = exports.upload = void 0;
const gcp_storage_1 = require("../services/gcp-storage");
const upload = async (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
    }
    const filename = `${Date.now()}-${req.file.originalname}`;
    await (0, gcp_storage_1.uploadVideo)(req.file.buffer, filename, req.file.mimetype);
    const url = await (0, gcp_storage_1.getSignedUrl)(filename);
    res.json({ filename, url });
};
exports.upload = upload;
const getUrl = async (req, res) => {
    const filename = req.params.filename;
    const url = await (0, gcp_storage_1.getSignedUrl)(filename);
    res.json({ url });
};
exports.getUrl = getUrl;
const remove = async (req, res) => {
    const filename = req.params.filename;
    await (0, gcp_storage_1.deleteVideo)(filename);
    res.status(204).send();
};
exports.remove = remove;
