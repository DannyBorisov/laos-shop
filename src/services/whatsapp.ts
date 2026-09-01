import config from "../config";

type TextMessage = {
  to: string;
  body: string;
};

type TemplateMessage = {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: TemplateComponent[];
};

type TemplateComponent = {
  type: "header" | "body" | "button";
  parameters: TemplateParameter[];
};

type TemplateParameter = {
  type: "text" | "image" | "document";
  text?: string;
  image?: { link: string };
  document?: { link: string; filename: string };
};

type MediaMessage = {
  to: string;
  type: "image" | "document" | "video" | "audio";
  url: string;
  caption?: string;
  filename?: string;
};

type MessageResponse = {
  messaging_product: string;
  contacts: { input: string; wa_id: string }[];
  messages: { id: string }[];
};

type WebhookMessage = {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
};

class WhatsApp {
  private baseUrl = "https://graph.facebook.com/v18.0";
  private apiKey: string;
  private phoneId: string;

  constructor(apiKey: string, phoneId: string) {
    this.apiKey = apiKey;
    this.phoneId = phoneId;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    }).catch((error) => {
      console.error("Failed to make WhatsApp request:", error);
      return Promise.reject(error);
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`WhatsApp request failed (${response.status}): ${body}`);
    }

    return response.json() as Promise<T>;
  }

  async sendText(params: TextMessage): Promise<MessageResponse> {
    return this.request<MessageResponse>(`/${this.phoneId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: params.to,
        type: "text",
        text: { body: params.body },
      }),
    });
  }

  async sendTemplate(params: TemplateMessage): Promise<MessageResponse> {
    return this.request<MessageResponse>(`/${this.phoneId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: params.to,
        type: "template",
        template: {
          name: params.templateName,
          language: { code: params.languageCode || "en" },
          components: params.components || [],
        },
      }),
    });
  }

  async sendMedia(params: MediaMessage): Promise<MessageResponse> {
    const mediaObject: Record<string, unknown> = { link: params.url };

    if (params.caption) {
      mediaObject.caption = params.caption;
    }

    if (params.filename && params.type === "document") {
      mediaObject.filename = params.filename;
    }

    return this.request<MessageResponse>(`/${this.phoneId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: params.to,
        type: params.type,
        [params.type]: mediaObject,
      }),
    });
  }

  async markAsRead(messageId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/${this.phoneId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    });
  }
}

export type {
  TextMessage,
  TemplateMessage,
  MediaMessage,
  MessageResponse,
  WebhookMessage,
};

const whatsapp = new WhatsApp(
  config.env.WHATSAPP_API_KEY,
  config.env.WHATSAPP_PHONE_ID,
);

export default whatsapp;
