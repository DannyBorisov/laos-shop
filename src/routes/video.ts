import { Router } from "express";
import multer from "multer";
import { upload, getUrl, remove } from "../handlers/video";

const router = Router();
const uploader = multer({ storage: multer.memoryStorage() });

router.post("/upload", uploader.single("video"), upload);
router.get("/url/:filename", getUrl);
router.delete("/:filename", remove);

export default router;
