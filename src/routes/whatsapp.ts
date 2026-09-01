import { Router } from "express";
import { sendTestMessage, verifyWebhook, handleWebhook } from "../handlers/whatsapp";

const router = Router();

router
  .post("/test", sendTestMessage)
  .get("/webhook", verifyWebhook)
  .post("/webhook", handleWebhook);

export default router;
