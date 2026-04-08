import express from "express";
import cors from "cors";
import path from "path";
import { env } from "./config/env";
import callsRouter from "./routes/calls.routes";
import { errorMiddleware } from "./middlewares/error.middleware";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        env.FRONTEND_URL,
        "http://localhost:3000",
        "https://patient-call-analysis-git-main-yashpawaras-projects.vercel.app",
        "http://127.0.0.1:3000",
        "https://patient-call-analysis-git-main-yashpawaras-projects.vercel.app",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
      ];

      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/calls", callsRouter);

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Patient Call Analysis API is running" });
});

app.use(errorMiddleware);

export default app;
