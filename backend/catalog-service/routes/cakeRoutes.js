
import express from "express";

import {
    getAllCakes,
    getCakeById
} from "../controllers/cakeController.js";

const router = express.Router();

// GET all cakes
router.get("/", getAllCakes);

// GET cake by ID
router.get("/:id", getCakeById);

export default router;
