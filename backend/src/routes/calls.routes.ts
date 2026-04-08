import { Router } from "express";
import { upload } from "../middlewares/upload.middleware";
import { uploadCall, getAllCalls, getCallById } from "../controllers/upload.controller";
import { transcribeCall } from "../controllers/transcription.controller";
import { analyzeTranscript } from "../controllers/analysis.controller";

const router = Router();

router.get("/", getAllCalls);

router.post("/upload", upload.single("file"), uploadCall);

router.get("/:id", getCallById);

router.post("/:id/transcribe", transcribeCall);

router.post("/:id/analyze", analyzeTranscript);

export default router;
