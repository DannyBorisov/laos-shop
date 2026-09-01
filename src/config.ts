import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

export enum NodeEnv {
  Development = "development",
  Production = "production",
}

const EnvSchema = z.object({
  NODE_ENV: z.enum([NodeEnv.Development, NodeEnv.Production]),
  PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PHAJAY_SECRET: z.string(),
  WHATSAPP_API_KEY: z.string(),
  WHATSAPP_PHONE_ID: z.string(),
  WHATSAPP_ORDER_FULFILLMENT_PHONE_NUMBER: z.string(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string(),
  ADMIN_USERNAME: z.string().default("admin"),
  ADMIN_PASSWORD: z.string(),
});

const env = EnvSchema.parse(process.env);

export default { env };
