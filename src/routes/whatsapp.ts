import { Router } from "express";
import { verifyWebhook, handleWebhook } from "../handlers/whatsapp";

const router = Router();

router.get("/webhook", verifyWebhook).post("/webhook", handleWebhook);

export default router;
