
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db.js";
import orderRoutes from "./routes/orderRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/orders", orderRoutes);

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({
        message: "Order Service is running"
    });
});

// Start server
const PORT = process.env.PORT || 8002;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
    console.log(`Order Service running on port ${PORT}`);
});
};

startServer();
