
import express from "express";

import {
    getNotificationStatus
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/:orderId", getNotificationStatus);

export default router;
