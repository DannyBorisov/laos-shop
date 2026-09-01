"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Proxy Google Drive images to avoid CORS/forbidden issues
router.get("/:fileId", async (req, res) => {
    const { fileId } = req.params;
    const url = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    try {
        const response = await fetch(url, {
            redirect: "follow",
        });
        if (!response.ok) {
            return res.status(response.status).send("Image not found");
        }
        const contentType = response.headers.get("content-type") || "image/jpeg";
        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 1 day
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
    }
    catch (error) {
        console.error("Failed to fetch image:", error);
        res.status(500).send("Failed to fetch image");
    }
});
exports.default = router;
