import { Handler } from "express";
import whatsapp from "../services/whatsapp";
import config from "../config";

export const WhatsappTemplates = {
  NEW_ORDER: {
    name: "new_order",
    languageCode: "lo",
  },
};

interface TestMessageRequest {
  to?: string;
  message?: string;
}

// Webhook verification handler (GET request from Meta)
export const verifyWebhook: Handler = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("Webhook verification request:", { mode, token, challenge });

  if (
    mode === "subscribe" &&
    token === config.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    console.log("Webhook verified successfully");
    res.status(200).send(challenge);
  } else {
    console.error("Webhook verification failed - token mismatch");
    res.sendStatus(403);
  }
};

// Webhook handler for incoming messages (POST request from Meta)
export const handleWebhook: Handler = (req, res) => {
  const body = req.body;

  console.log("Webhook received:", JSON.stringify(body, null, 2));

  // Check if this is a WhatsApp status update or message
  if (body.object === "whatsapp_business_account") {
    body.entry?.forEach((entry: any) => {
      entry.changes?.forEach((change: any) => {
        if (change.field === "messages") {
          const value = change.value;

          // Handle incoming messages
          if (value.messages) {
            value.messages.forEach((message: any) => {
              console.log("Incoming message:", {
                from: message.from,
                type: message.type,
                text: message.text?.body,
                timestamp: message.timestamp,
              });

              // TODO: Handle the message (e.g., auto-reply, store in DB, etc.)
            });
          }

          // Handle status updates
          if (value.statuses) {
            value.statuses.forEach((status: any) => {
              console.log("Message status update:", {
                id: status.id,
                status: status.status,
                recipient: status.recipient_id,
              });
            });
          }
        }
      });
    });

    // Always return 200 quickly to acknowledge receipt
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
};
