import express from "express";
import { getReviewStream } from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/get-review", getReviewStream);

export default router;
