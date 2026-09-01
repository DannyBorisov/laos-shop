import { Router } from "express";
import productRoutes from "./product";
import orderRoutes from "./order";
import videoRoutes from "./video";
import imageRoutes from "./image";
import categoryRoutes from "./category";
import whatsappRoutes from "./whatsapp";
import adminRoutes from "./admin";

const router = Router();

router
  .use("/products", productRoutes)
  .use("/orders", orderRoutes)
  .use("/video", videoRoutes)
  .use("/image", imageRoutes)
  .use("/categories", categoryRoutes)
  .use("/whatsapp", whatsappRoutes)
  .use("/admin", adminRoutes);

export default router;
