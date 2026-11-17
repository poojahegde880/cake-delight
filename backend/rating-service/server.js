
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db.js";
import ratingRoutes from "./routes/ratingRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Rating routes
app.use("/ratings", ratingRoutes);

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({
        message: "Rating Service is running"
    });
});

const PORT = process.env.PORT || 8003;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
    console.log(`Rating Service running on port ${PORT}`);
});
};

startServer();
