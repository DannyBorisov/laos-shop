"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const video_1 = require("../handlers/video");
const router = (0, express_1.Router)();
const uploader = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.post("/upload", uploader.single("video"), video_1.upload);
router.get("/url/:filename", video_1.getUrl);
router.delete("/:filename", video_1.remove);
exports.default = router;
