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

export const sendTestMessage: Handler = async (req, res) => {
  const { to, templateName = "new_order" } = req.body as TestMessageRequest & {
    templateName?: string;
  };

  const recipient = to || config.env.WHATSAPP_ORDER_FULFILLMENT_PHONE_NUMBER;

  const order = {
    id: "12345",
    phoneNumber: "972545290475",
    address: "Vientiane, Laos",
  };

  const itemsList = "Product 1 x2, Product 2 x1";

  try {
    const response = await whatsapp.sendTemplate({
      to: recipient,
      templateName: WhatsappTemplates.NEW_ORDER.name,
      languageCode: WhatsappTemplates.NEW_ORDER.languageCode,
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: `${order.id}` },
            { type: "text", text: `${order.phoneNumber}` },
            { type: "text", text: `${order.address}` },
            { type: "text", text: `${itemsList}` },
          ],
        },
      ],
    });

    console.log("WhatsApp test template response:", response);

    res.json({
      success: true,
      messageId: response.messages[0]?.id,
      to: recipient,
      template: templateName,
    });
  } catch (error) {
    console.error("Failed to send WhatsApp test message:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to send message",
    });
  }
};
