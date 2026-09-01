import { Request, Response } from "express";
import { uploadMedia, getSignedUrl, deleteMedia } from "../services/gcp-storage";

export const upload = async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }

  const filename = `images/${Date.now()}-${req.file.originalname}`;
  await uploadMedia(req.file.buffer, filename, req.file.mimetype);
  const url = await getSignedUrl(filename);

  res.json({ filename, url });
};

export const getUrl = async (req: Request, res: Response) => {
  const filename = req.params.filename as string;
  const url = await getSignedUrl(filename);
  res.json({ url });
};

export const remove = async (req: Request, res: Response) => {
  const filename = req.params.filename as string;
  await deleteMedia(filename);
  res.status(204).send();
};
