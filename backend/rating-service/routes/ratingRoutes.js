import express from "express";

import {
    getRatingSummary,
    submitRating
} from "../controllers/ratingController.js";

const router = express.Router();

router.get("/:cakeId/summary", getRatingSummary);
router.post("/", submitRating);

export default router;