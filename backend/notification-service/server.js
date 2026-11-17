
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import startOrderConsumer from "./consumers/orderConsumer.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/notifications", notificationRoutes);

app.get("/health", (req, res) => {
    res.status(200).json({
        message: "Notification Service is running"
    });
});

const PORT = process.env.PORT || 8004;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Notification Service running on port ${PORT}`);
    });

    await startOrderConsumer();
};

startServer();
