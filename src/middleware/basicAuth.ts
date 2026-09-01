import { Handler } from "express";
import config from "../config";

export const basicAuth: Handler = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin"');
    return res.status(401).json({ error: "Authentication required" });
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf8");
  const [username, password] = credentials.split(":");

  if (
    username === config.env.ADMIN_USERNAME &&
    password === config.env.ADMIN_PASSWORD
  ) {
    next();
  } else {
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin"');
    res.status(401).json({ error: "Invalid credentials" });
  }
};
