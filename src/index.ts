import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import routes from "./routes";
import config from "./config";
import { basicAuth } from "./middleware/basicAuth";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/api", routes);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: err.message });
  },
);

const clientDistPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientDistPath));

app.get("/admin", basicAuth, (_req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

const port = config.env.PORT;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
