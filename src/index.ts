import express from "express";
import cors from "cors";
import path from "path";
import routes from "./routes";
import config from "./config";

const app = express();

// Simple logger
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());
app.use("/api", routes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Serve static files from client/dist
const clientDistPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientDistPath));

// SPA fallback - serve index.html for all non-API routes
app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// Start server (Cloud Run sets PORT env var)
const port = process.env.PORT || config.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
