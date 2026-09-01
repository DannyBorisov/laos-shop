import config from "../config";

type GenerateQrParams = {
  amount: number;
  description: string;
  tag1?: string;
  tag2?: string;
  tag3?: string;
};

type GenerateQrResponse = {
  message: string;
  transactionId: string;
  qrCode: string;
  link: string;
};

export enum PhajayPaymentStatus {
  PaymentCompleted = "PAYMENT_COMPLETED",
  Failed = "FAILED",
}

class Phajay {
  private baseUrl = "https://payment-gateway.phajay.co/v1/api";
  private secretKey: string;

  constructor(secretKey: string, isSandbox: boolean = false) {
    this.secretKey = secretKey;

    if (isSandbox) {
      this.baseUrl += "/test";
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        secretKey: this.secretKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();

      throw new Error(`Phajay request failed (${response.status}): ${body}`);
    }

    return response.json() as Promise<T>;
  }

  async generateLBDQr(params: GenerateQrParams): Promise<GenerateQrResponse> {
    return this.request<GenerateQrResponse>("/payment/generate-ldb-qr", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }
}

// sandbox is not working
const phajay = new Phajay(config.env.PHAJAY_SECRET, false);

export default phajay;
